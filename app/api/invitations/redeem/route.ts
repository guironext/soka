import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashInvitationCode } from "@/lib/invitation-code";
import { canIssueInvitation } from "@/lib/roles";
import { syncClerkAppMetadata } from "@/lib/clerk-sync";
import { requireClerkAuth, getAppUserByClerkId } from "@/lib/app-user";

export async function POST(req: Request) {
  try {
    const clerkId = await requireClerkAuth();
    const body = (await req.json()) as { code?: string };
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const user = await getAppUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: "User not provisioned yet" }, { status: 404 });
    }
    if (user.status === "ACTIVE") {
      return NextResponse.json({ error: "Account already active" }, { status: 400 });
    }

    const codeHash = hashInvitationCode(code);
    const invitation = await prisma.invitation.findUnique({
      where: { codeHash },
      include: { issuer: true },
    });

    if (!invitation || invitation.revokedAt) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }
    if (invitation.uses >= invitation.maxUses) {
      return NextResponse.json({ error: "Code already used" }, { status: 400 });
    }

    const issuer = invitation.issuer;
    if (issuer.status !== "ACTIVE" || !issuer.role) {
      return NextResponse.json({ error: "Invalid invitation issuer" }, { status: 400 });
    }
    if (!canIssueInvitation(issuer.role, invitation.targetRole)) {
      return NextResponse.json({ error: "Invitation no longer valid" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { uses: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          status: "PENDING_APPROVAL",
          pendingTargetRole: invitation.targetRole,
        },
      }),
    ]);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    await syncClerkAppMetadata(clerkId, {
      status: updated.status,
      role: updated.role,
    });

    return NextResponse.json({
      status: updated.status,
      pendingTargetRole: updated.pendingTargetRole,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
