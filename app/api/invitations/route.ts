import { NextResponse } from "next/server";
import type { Role } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import { ALL_KNOWN_ROLES, canIssueInvitation } from "@/lib/roles";
import { generateInvitationCode, hashInvitationCode } from "@/lib/invitation-code";
import { requireActiveAppUser } from "@/lib/app-user";
import { getAppOrigin } from "@/lib/app-url";

const VALID_ROLES: Role[] = [...ALL_KNOWN_ROLES];

const RESPONSABILITE_MAX = 500;
/** Max length embedded in invite URL (évite URLs excessives). */
const RESPONSABILITE_URL_MAX = 220;

export async function POST(req: Request) {
  try {
    const issuer = await requireActiveAppUser();
    const body = (await req.json()) as {
      targetRole?: string;
      expiresInDays?: number;
      maxUses?: number;
      responsabilite?: string;
    };
    const targetRole = body.targetRole as Role | undefined;
    if (!targetRole || !VALID_ROLES.includes(targetRole)) {
      return NextResponse.json({ error: "Invalid targetRole" }, { status: 400 });
    }
    if (!canIssueInvitation(issuer.role, targetRole)) {
      return NextResponse.json({ error: "Cannot issue invitation for this role" }, { status: 403 });
    }

    const responsabiliteRaw =
      typeof body.responsabilite === "string" ? body.responsabilite.trim() : "";
    if (!responsabiliteRaw) {
      return NextResponse.json(
        { error: "La responsabilité est requise" },
        { status: 400 },
      );
    }
    if (responsabiliteRaw.length > RESPONSABILITE_MAX) {
      return NextResponse.json(
        { error: `La responsabilité ne peut pas dépasser ${RESPONSABILITE_MAX} caractères` },
        { status: 400 },
      );
    }

    const plain = generateInvitationCode();
    const codeHash = hashInvitationCode(plain);
    const expiresInDays = body.expiresInDays ?? 30;
    const expiresAt = new Date(Date.now() + expiresInDays * 86400000);
    const maxUses = Math.min(Math.max(body.maxUses ?? 1, 1), 100);

    await prisma.invitation.create({
      data: {
        codeHash,
        responsabilite: responsabiliteRaw,
        targetRole,
        issuerId: issuer.id,
        expiresAt,
        maxUses,
      },
    });

    const inviteUrl = new URL("/onboarding", `${getAppOrigin()}/`);
    inviteUrl.searchParams.set("code", plain);
    inviteUrl.searchParams.set("role", targetRole);
    const forUrl =
      responsabiliteRaw.length <= RESPONSABILITE_URL_MAX
        ? responsabiliteRaw
        : `${responsabiliteRaw.slice(0, RESPONSABILITE_URL_MAX - 1)}…`;
    inviteUrl.searchParams.set("responsabilite", forUrl);

    return NextResponse.json({
      code: plain,
      targetRole,
      responsabilite: responsabiliteRaw,
      inviteUrl: inviteUrl.toString(),
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
