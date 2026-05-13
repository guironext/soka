import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/app/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

/** Maps legacy sslmode values to verify-full so behavior matches pg v8 and silences pg-connection-string warnings. */
function normalizePgConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const mode = url.searchParams.get("sslmode");
    if (mode === "require" || mode === "prefer" || mode === "verify-ca") {
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }
  } catch {
    // leave unchanged if URL is not parseable
  }
  return connectionString;
}

function createPool(connectionString: string): Pool {
  const pool = new Pool({
    connectionString: normalizePgConnectionString(connectionString),
    /**
     * Cloud Postgres providers (Neon, Supabase, RDS Proxy, etc.) close idle TCP
     * connections aggressively. Drop idle clients from the pool *before* the
     * server kills them so we don't reuse a dead socket and surface
     * `PrismaClientKnownRequestError: Server has closed the connection`.
     */
    idleTimeoutMillis: 5_000,
    keepAlive: true,
    max: 10,
    /** Recycle clients after N queries so long-lived dev servers don't reuse sockets the host already closed. */
    maxUses: 500,
    connectionTimeoutMillis: 20_000,
  });
  /**
   * `pg.Pool` emits `error` for idle-client failures. Without a listener it
   * becomes an uncaught exception and the dev server dies. We swallow it and
   * let the next acquire create a fresh client.
   */
  pool.on("error", (err) => {
    console.error("[pg.pool] idle client error", err);
  });
  return pool;
}

function isTransientDbConnectionError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const code =
    "code" in error ? String((error as { code?: unknown }).code) : "";
  if (code === "P1017") {
    return true;
  }
  const message =
    "message" in error
      ? String((error as { message?: unknown }).message)
      : "";
  return (
    message.includes("Server has closed the connection") ||
    message.includes("Connection terminated unexpectedly") ||
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("EPIPE")
  );
}

/**
 * Up to 2 retries after a transient disconnect; avoids flaky Neon idle closes
 * on dashboards and API routes.
 */
function extendClientWithConnectionRetry(base: PrismaClient): PrismaClient {
  const extended = base.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const maxAttempts = 3;
          let last: unknown;
          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              return await query(args);
            } catch (e) {
              last = e;
              if (!isTransientDbConnectionError(e) || attempt === maxAttempts) {
                throw e;
              }
              await new Promise((r) => setTimeout(r, 80 * attempt));
            }
          }
          throw last;
        },
      },
    },
  });
  return extended as unknown as PrismaClient;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = globalForPrisma.pool ?? createPool(connectionString);
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }
  const adapter = new PrismaPg(pool);
  const base = new PrismaClient({ adapter });
  return extendClientWithConnectionRetry(base);
}

/**
 * Lazy client so importing `@/lib/prisma` does not throw during `next build`
 * when `DATABASE_URL` is unset (e.g. Vercel build env not yet configured).
 * The error surfaces on first real DB use instead.
 */
let prismaSingleton: PrismaClient | undefined;

function resolvePrisma(): PrismaClient {
  if (prismaSingleton) {
    return prismaSingleton;
  }
  if (globalForPrisma.prisma) {
    prismaSingleton = globalForPrisma.prisma;
    return prismaSingleton;
  }
  prismaSingleton = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaSingleton;
  }
  return prismaSingleton;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = resolvePrisma();
    const value = Reflect.get(client as object, prop, client);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
}) as PrismaClient;
