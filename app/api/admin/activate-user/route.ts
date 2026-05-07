import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AccountStatus } from "@/app/generated/prisma";
import { getAppUserByClerkId } from "@/lib/app-user";
import { syncClerkAppMetadata } from "@/lib/clerk-sync";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/roles";

export async function POST(req: Request) {
  try {
    const { userId: clerkViewerId } = await auth();
    if (!clerkViewerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const viewer = await getAppUserByClerkId(clerkViewerId);
    if (!viewer || !isAdmin(viewer.role)) {
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
