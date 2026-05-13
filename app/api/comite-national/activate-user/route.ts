import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AccountStatus, Role } from "@/app/generated/prisma";
import { getAppUserByClerkId } from "@/lib/app-user";
import { syncClerkAppMetadata } from "@/lib/clerk-sync";
import { prisma } from "@/lib/prisma";

/** Pending roles the comité national may finaliser (aligné avec `a-actives`). */
const ACTIVATABLE_BY_COMITE: Role[] = [
  Role.REGION,
  Role.CENTRE,
  Role.CENTRE_GENERAL,
];

export async function POST(req: Request) {
  try {
    const { userId: clerkViewerId } = await auth();
    if (!clerkViewerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const viewer = await getAppUserByClerkId(clerkViewerId);
    if (
      !viewer ||
      viewer.role !== "COMITE_NATIONAL" ||
      viewer.status !== AccountStatus.ACTIVE
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as { userId?: string };
    const targetId = typeof body.userId === "string" ? body.userId.trim() : "";
    if (!targetId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const subject = await prisma.user.findUnique({ where: { id: targetId } });
    if (!subject) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (subject.status !== AccountStatus.PENDING_APPROVAL) {
      return NextResponse.json(
        { error: "User is not pending approval" },
        { status: 400 },
      );
    }
    if (subject.role != null) {
      return NextResponse.json(
        { error: "User already has a role" },
        { status: 400 },
      );
    }
    if (subject.pendingTargetRole == null) {
      return NextResponse.json(
        { error: "No pending target role" },
        { status: 400 },
      );
    }
    if (!ACTIVATABLE_BY_COMITE.includes(subject.pendingTargetRole)) {
      return NextResponse.json(
        {
          error:
            "Ce compte ne peut pas être activé depuis le comité national pour ce rôle cible.",
        },
        { status: 403 },
      );
    }

    const targetRole = subject.pendingTargetRole;

    await prisma.user.update({
      where: { id: subject.id },
      data: {
        role: targetRole,
        status: AccountStatus.ACTIVE,
      },
    });

    await syncClerkAppMetadata(subject.clerkId, {
      status: AccountStatus.ACTIVE,
      role: targetRole,
      pendingTargetRole: subject.pendingTargetRole,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
