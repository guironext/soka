import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMissingApproverRoles, isOnboardingComplete } from "@/lib/onboarding-logic";
import { syncClerkAppMetadata } from "@/lib/clerk-sync";
import { requireActiveAppUser } from "@/lib/app-user";

export async function POST(req: Request) {
  try {
    const approver = await requireActiveAppUser();
    const body = (await req.json()) as { subjectEmail?: string };
    const email = typeof body.subjectEmail === "string" ? body.subjectEmail.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "Missing subjectEmail" }, { status: 400 });
    }

    const subject = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        status: "PENDING_APPROVAL",
        pendingTargetRole: { not: null },
      },
      include: { approvalsReceived: true },
    });

    if (!subject || !subject.pendingTargetRole) {
      return NextResponse.json({ error: "Pending member not found" }, { status: 404 });
    }

    if (subject.id === approver.id) {
      return NextResponse.json({ error: "Cannot approve yourself" }, { status: 400 });
    }

    const missing = getMissingApproverRoles(subject.pendingTargetRole, subject.approvalsReceived);
    if (!missing.length) {
      return NextResponse.json({ error: "Already fully approved" }, { status: 400 });
    }
    if (!missing.includes(approver.role)) {
      return NextResponse.json(
        {
          error: "Your role is not authorized to approve this member for the next required step",
          missingApproverRoles: missing,
        },
        { status: 403 },
      );
    }

    await prisma.onboardingApproval.create({
      data: {
        subjectUserId: subject.id,
        approverUserId: approver.id,
        approverRole: approver.role,
      },
    });

    const refreshed = await prisma.user.findUniqueOrThrow({
      where: { id: subject.id },
      include: { approvalsReceived: true },
    });

    const target = refreshed.pendingTargetRole;
    if (!target) {
      return NextResponse.json({ error: "Invalid state" }, { status: 500 });
    }

    if (isOnboardingComplete(target, refreshed.approvalsReceived)) {
      const clerkId = refreshed.clerkId;
      await prisma.user.update({
        where: { id: refreshed.id },
        data: {
          status: "ACTIVE",
          role: target,
          pendingTargetRole: null,
        },
      });
      const finalUser = await prisma.user.findUniqueOrThrow({ where: { id: refreshed.id } });
      await syncClerkAppMetadata(clerkId, {
        status: finalUser.status,
        role: finalUser.role,
      });
      return NextResponse.json({ ok: true, activated: true, role: finalUser.role });
    }

    return NextResponse.json({
      ok: true,
      activated: false,
      missingApproverRoles: getMissingApproverRoles(target, refreshed.approvalsReceived),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "You already approved this member" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
