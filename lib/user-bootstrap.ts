/**
 * Comma-separated Clerk user IDs that become ADMIN + ACTIVE on first sync (webhook).
 * Set in production for the first platform administrators.
 */
export function getBootstrapAdminClerkIds(): Set<string> {
  const raw = process.env.SOKA_BOOTSTRAP_ADMIN_CLERK_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/** Comma-separated admin e-mails (fallback when the Clerk ID env var is not set yet). */
export function getBootstrapAdminEmails(): Set<string> {
  const raw = process.env.SOKA_BOOTSTRAP_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function shouldBootstrapAsAdmin(clerkId: string, email?: string | null): boolean {
  if (getBootstrapAdminClerkIds().has(clerkId)) return true;
  const normalized = email?.trim().toLowerCase();
  return normalized != null && normalized !== "" && getBootstrapAdminEmails().has(normalized);
}
