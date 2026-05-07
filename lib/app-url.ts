/**
 * Public site origin for absolute invite links (emails, copy-paste).
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://hub.example.com).
 */
export function getAppOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.startsWith("http") ? vercel : `https://${vercel}`;
    return host.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

/**
 * Origins Clerk should treat as authorized for this app (subdomain cookie leak protection).
 * Override with comma-separated full origins, e.g. http://localhost:3001,https://hub.example.com
 */
export function getClerkAuthorizedParties(): string[] {
  const explicit = process.env.CLERK_AUTHORIZED_PARTIES?.trim();
  if (explicit) {
    return explicit.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [getAppOrigin()];
}
