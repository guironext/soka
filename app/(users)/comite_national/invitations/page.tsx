import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Role } from "@/app/generated/prisma";
import { getAppUserByClerkId } from "@/lib/app-user";
import { dashboardPathForRole } from "@/lib/roles";
import { ComiteNationalInvitationForm } from "./invitation-form";

const ALLOWED_TARGETS = new Set<Role>(["CENTRE", "DISTRICT"]);

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

  const roleOptions =
    user.status === "ACTIVE"
      ? [
          { value: "CENTRE" as const, label: "Centre" },
          { value: "DISTRICT" as const, label: "District" },
        ].filter((o) => ALLOWED_TARGETS.has(o.value as Role))
      : [];

  return <ComiteNationalInvitationForm roleOptions={roleOptions} />;
}
