import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAppUserByClerkId } from "@/lib/app-user";
import { syncClerkAppMetadata } from "@/lib/clerk-sync";
import { dashboardPathForRole } from "@/lib/roles";

export default async function ComiteNationalPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await getAppUserByClerkId(userId);
  if (!user || !user.role) {
    redirect("/dashboard");
  }

  if (user.role !== "COMITE_NATIONAL") {
    redirect(dashboardPathForRole(user.role));
  }

  // Self-heal a stale Clerk session: if the user reaches this page via the
  // DB role (JWT lagging after validation), nudge the publicMetadata so the
  // next session refresh carries the correct claims.
  try {
    await syncClerkAppMetadata(user.clerkId, {
      status: user.status,
      role: user.role,
      pendingTargetRole: user.pendingTargetRole ?? null,
    });
  } catch {
    // Non-fatal: the page can still render; logs are emitted by Clerk SDK.
  }

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.email;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Espace Comité national
      </h1>
      <p className="mt-2 text-muted-foreground">
        Bienvenue {displayName}. Cet espace est réservé aux membres du comité
        national.
      </p>
    </div>
  );
}
