function vercelDeploymentOrigin(): string | null {
  const vercel = process.env.VERCEL_URL?.trim();
  if (!vercel) return null;
  const host = vercel.startsWith("http") ? vercel : `https://${vercel}`;
  return host.replace(/\/$/, "");
}

function normalizeOrigin(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const withProto = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    return new URL(withProto).origin;
  } catch {
    return null;
  }
}

function addOrigin(set: Set<string>, value: string | null | undefined): void {
  if (!value) return;
  const origin = normalizeOrigin(value);
  if (!origin) return;
  if (process.env.VERCEL && origin.includes("localhost")) return;
  set.add(origin);
}

/**
 * Public site origin for absolute invite links (emails, copy-paste).
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://soka-rho.vercel.app).
 */
export function getAppOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const fromVercel = vercelDeploymentOrigin();

  // On Vercel, a leftover localhost APP_URL breaks Clerk session validation.
  if (fromVercel && (!explicit || explicit.includes("localhost"))) {
    return fromVercel;
  }

  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  if (fromVercel) {
    return fromVercel;
  }
  return "http://localhost:3000";
}

/**
 * Origins Clerk should treat as authorized for this app (subdomain cookie leak protection).
 * Override with comma-separated full origins via CLERK_AUTHORIZED_PARTIES.
 *
 * Middleware also adds the current request origin per request — required when the app is
 * served on both a Vercel alias (e.g. soka-rho.vercel.app) and deployment URLs.
 */
export function getClerkAuthorizedParties(): string[] {
  const set = new Set<string>();

  addOrigin(set, getAppOrigin());
  addOrigin(set, vercelDeploymentOrigin());

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) {
    addOrigin(set, productionHost);
  }

  const explicitApp = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicitApp) {
    addOrigin(set, explicitApp);
  }

  const explicit = process.env.CLERK_AUTHORIZED_PARTIES?.trim();
  if (explicit) {
    for (const part of explicit.split(",")) {
      addOrigin(set, part);
    }
  }

  return [...set];
}
