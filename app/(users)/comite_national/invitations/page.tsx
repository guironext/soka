import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminInvitationForm } from "@/app/(users)/admin/invitations/invitation-form";
import { getAppUserByClerkId } from "@/lib/app-user";
import {
  ADMIN_INVITATION_ROLE_OPTIONS,
  canIssueInvitation,
  dashboardPathForRole,
} from "@/lib/roles";

const REGION_INVITE_OPTION = ADMIN_INVITATION_ROLE_OPTIONS.find(
  (o) => o.value === "REGION",
)!;

export default async function ComiteNationalInvitationsPage() {
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

  const issuerRole = user.status === "ACTIVE" ? user.role : null;
  const roleOptions =
    issuerRole && canIssueInvitation(issuerRole, "REGION")
      ? [REGION_INVITE_OPTION]
      : [];

  return <AdminInvitationForm roleOptions={roleOptions} />;
}
