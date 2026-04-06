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

export function shouldBootstrapAsAdmin(clerkId: string): boolean {
  return getBootstrapAdminClerkIds().has(clerkId);
}
