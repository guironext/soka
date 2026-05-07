import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAppUserByClerkId } from "@/lib/app-user";
import {
  ADMIN_INVITATION_ROLE_OPTIONS,
  canIssueInvitation,
  isAdmin,
} from "@/lib/roles";
import { AdminInvitationForm } from "./invitation-form";

export default async function AdminInvitationsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await getAppUserByClerkId(userId);
  if (!user || !isAdmin(user.role)) {
    redirect("/");
  }

  const issuerRole = user.status === "ACTIVE" ? user.role : null;
  const roleOptions = issuerRole
    ? ADMIN_INVITATION_ROLE_OPTIONS.filter((o) => canIssueInvitation(issuerRole, o.value))
    : [];

  return <AdminInvitationForm roleOptions={roleOptions} />;
}
