import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Role } from "@/app/generated/prisma";
import { getAppUserByClerkId } from "@/lib/app-user";
import { canIssueInvitation, dashboardPathForRole } from "@/lib/roles";
import { CentreGeneralInvitationForm } from "@/app/(users)/centre_general/invitations/invitation-form";

const ALLOWED_TARGETS: { value: Role; label: string }[] = [
  { value: "CENTRE_GENERAL", label: "Centre général" },
  { value: "CENTRE", label: "Centre" },
];

export default async function CentreGeneralInvitationsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await getAppUserByClerkId(userId);
  if (!user || !user.role) {
    redirect("/dashboard");
  }

  /**
   * This section primarily targets CENTRE_GENERAL users, but we allow COMITE_NATIONAL/ADMIN
   * to access it if they navigate here; permissions still apply via `canIssueInvitation`.
   */
  if (!["CENTRE_GENERAL", "COMITE_NATIONAL", "ADMIN"].includes(user.role)) {
    redirect(dashboardPathForRole(user.role));
  }

  const issuerRole = user.status === "ACTIVE" ? user.role : null;
  const roleOptions = issuerRole
    ? ALLOWED_TARGETS.filter((o) => canIssueInvitation(issuerRole, o.value))
    : [];

  return <CentreGeneralInvitationForm roleOptions={roleOptions} />;
}