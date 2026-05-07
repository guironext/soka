import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AccountStatus, Role } from "@/app/generated/prisma";
import { PendingLeadersView } from "@/app/(users)/admin/a-actives/pending-leaders-view";
import { getAppUserByClerkId } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/roles";

export default async function AdminAActivesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const viewer = await getAppUserByClerkId(userId);
  if (!viewer || !isAdmin(viewer.role)) {
    redirect("/");
  }

  const rows = await prisma.user.findMany({
    where: {
      status: AccountStatus.PENDING_APPROVAL,
      role: null,
      pendingTargetRole: {
        in: [Role.COMITE_NATIONAL, Role.CENTRE_GENERAL],
      },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      pendingTargetRole: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return <PendingLeadersView initialRows={rows} />;
}
