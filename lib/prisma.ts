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
    idleTimeoutMillis: 10_000,
    keepAlive: true,
    max: 10,
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
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
