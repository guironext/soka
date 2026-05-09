import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Role } from "@/app/generated/prisma";
import { getAppUserByClerkId } from "@/lib/app-user";
import { canIssueInvitation, dashboardPathForRole } from "@/lib/roles";
import { CentreInvitationForm } from "./invitation-form";

const ALLOWED_TARGETS: { value: Role; label: string }[] = [
  { value: "CHAPITRE", label: "Chapitre" },
  { value: "DISTRICT", label: "District" },
];

export default async function CentreInvitationsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await getAppUserByClerkId(userId);
  if (!user || !user.role) {
    redirect("/dashboard");
  }

  if (user.role !== "CENTRE") {
    redirect(dashboardPathForRole(user.role));
  }

  const issuerRole = user.status === "ACTIVE" ? user.role : null;
  const roleOptions = issuerRole
    ? ALLOWED_TARGETS.filter((o) => canIssueInvitation(issuerRole, o.value))
    : [];

  return <CentreInvitationForm roleOptions={roleOptions} />;
}
