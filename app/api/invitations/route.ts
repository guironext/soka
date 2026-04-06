import { NextResponse } from "next/server";
import type { Role } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import { canIssueInvitation } from "@/lib/roles";
import { generateInvitationCode, hashInvitationCode } from "@/lib/invitation-code";
import { requireActiveAppUser } from "@/lib/app-user";

const VALID_ROLES: Role[] = [
  "COMITE_NATIONAL",
  "CENTRE_GENERAL",
  "CENTRE",
  "CHAPITRE",
  "DISTRICT",
  "GROUPE",
  "SOUS_GROUPE",
  "MEMBRE",
];

export async function POST(req: Request) {
  try {
    const issuer = await requireActiveAppUser();
    const body = (await req.json()) as {
      targetRole?: string;
      expiresInDays?: number;
      maxUses?: number;
    };
    const targetRole = body.targetRole as Role | undefined;
    if (!targetRole || !VALID_ROLES.includes(targetRole)) {
      return NextResponse.json({ error: "Invalid targetRole" }, { status: 400 });
    }
    if (!canIssueInvitation(issuer.role, targetRole)) {
      return NextResponse.json({ error: "Cannot issue invitation for this role" }, { status: 403 });
    }

    const plain = generateInvitationCode();
    const codeHash = hashInvitationCode(plain);
    const expiresInDays = body.expiresInDays ?? 30;
    const expiresAt = new Date(Date.now() + expiresInDays * 86400000);
    const maxUses = Math.min(Math.max(body.maxUses ?? 1, 1), 100);

    await prisma.invitation.create({
      data: {
        codeHash,
        targetRole,
        issuerId: issuer.id,
        expiresAt,
        maxUses,
      },
    });

    return NextResponse.json({
      code: plain,
      targetRole,
      expiresAt: expiresAt.toISOString(),
      maxUses,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
