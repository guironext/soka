import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AccountStatus, Role } from "@/app/generated/prisma";
import { PendingLeadersView } from "@/app/(users)/admin/a-actives/pending-leaders-view";
import { getAppUserByClerkId } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";

export default async function ComiteNationalAActivesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const viewer = await getAppUserByClerkId(userId);
  if (!viewer || !viewer.role) {
    redirect("/dashboard");
  }

  if (viewer.role !== "COMITE_NATIONAL") {
    redirect(dashboardPathForRole(viewer.role));
  }

  const rows = await prisma.user.findMany({
    where: {
      status: AccountStatus.PENDING_APPROVAL,
      role: null,
      pendingTargetRole: Role.REGION,
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

  const canActivate = viewer.status === AccountStatus.ACTIVE;

  return (
    <PendingLeadersView
      initialRows={rows}
      sectionLabel="Comité national"
      pageHeading="Comptes région — à activer"
      description={
        <>
          Utilisateurs au statut{" "}
          <span className="font-medium text-foreground">PENDING_APPROVAL</span>{" "}
          dont le rôle cible est{" "}
          <span className="font-medium text-foreground">REGION</span>. L’action
          attribue le rôle cible et passe le statut à{" "}
          <span className="font-medium text-foreground">ACTIVE</span>.
        </>
      }
      emptyStateDescription="Aucun compte en attente d’activation pour le rôle régional."
      headingId="comite-national-a-actives-heading"
      showActivateColumn={canActivate}
      activateEndpoint="/api/comite-national/activate-user"
      activateButtonLabel="Activer"
    />
  );
}
