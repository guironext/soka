import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { Role } from "@/app/generated/prisma";
import { getAppUserByClerkId } from "@/lib/app-user";
import { syncClerkAppMetadata } from "@/lib/clerk-sync";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/roles";

const LEADER_ROLES: Role[] = ["COMITE_NATIONAL", "CENTRE_REGION"];

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
    if (!subject?.role || !LEADER_ROLES.includes(subject.role)) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (subject.pendingTargetRole != null) {
      return NextResponse.json({ error: "Already processed" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: subject.id },
      data: {
        pendingTargetRole: subject.role,
        status: "ACTIVE",
      },
    });

    await syncClerkAppMetadata(subject.clerkId, {
      status: "ACTIVE",
      role: subject.role,
      pendingTargetRole: subject.role,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
