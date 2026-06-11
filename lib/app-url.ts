function vercelDeploymentOrigin(): string | null {
  const vercel = process.env.VERCEL_URL?.trim();
  if (!vercel) return null;
  const host = vercel.startsWith("http") ? vercel : `https://${vercel}`;
  return host.replace(/\/$/, "");
}

/**
 * Public site origin for absolute invite links (emails, copy-paste).
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://hub.example.com).
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
 * Override with comma-separated full origins, e.g. http://localhost:3001,https://hub.example.com
 *
 * When `CLERK_AUTHORIZED_PARTIES` is unset, we merge the primary app origin with the
 * current Vercel deployment URL (`VERCEL_URL`). That way production still works if
 * `NEXT_PUBLIC_APP_URL` was mistakenly set to `http://localhost:3000` on Vercel
 * (otherwise Clerk rejects sessions on https://*.vercel.app).
 */
export function getClerkAuthorizedParties(): string[] {
  const explicit = process.env.CLERK_AUTHORIZED_PARTIES?.trim();
  if (explicit) {
    return explicit.split(",").map((s) => s.trim()).filter(Boolean);
  }
  const set = new Set<string>();
  set.add(getAppOrigin());
  const vercelOrigin = vercelDeploymentOrigin();
  if (vercelOrigin) {
    set.add(vercelOrigin);
  }
  return [...set];
}
