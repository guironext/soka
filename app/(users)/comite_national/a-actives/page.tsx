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
      pendingTargetRole: {
        in: [Role.CENTRE, Role.CENTRE_GENERAL],
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

  return (
    <PendingLeadersView
      initialRows={rows}
      sectionLabel="Comité national"
      headingId="comite-national-a-actives-heading"
      pageHeading="Centres — comptes en attente"
      description={
        <>
          Utilisateurs au statut{" "}
          <span className="font-medium text-foreground">PENDING_APPROVAL</span>{" "}
          avec un rôle cible{" "}
          <span className="font-medium text-foreground">CENTRE</span> ou{" "}
          <span className="font-medium text-foreground">CENTRE_GENERAL</span>,
          sans rôle attribué.
        </>
      }
      emptyStateDescription="Aucune demande en attente pour ce périmètre (CENTRE / CENTRE_GENERAL)."
      activateEndpoint="/api/comite-national/activate-user"
      activateButtonLabel="Activer"
    />
  );
}
