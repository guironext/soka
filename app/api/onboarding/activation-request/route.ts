import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAppUserByClerkId, requireClerkAuth } from "@/lib/app-user";

/** Minimum delay between two activation reminders to the same issuer (same pending member). */
const MIN_INTERVAL_MS = 6 * 60 * 60 * 1000;

export async function POST() {
  try {
    const clerkId = await requireClerkAuth();
    const user = await getAppUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    if (user.status !== "PENDING_APPROVAL" || !user.pendingTargetRole) {
      return NextResponse.json({ error: "Compte non en attente d'activation" }, { status: 400 });
    }
    if (!user.invitedByUserId) {
      return NextResponse.json(
        { error: "Aucun contact d'invitation enregistré pour votre compte" },
        { status: 400 },
      );
    }

    const recipient = await prisma.user.findUnique({
      where: { id: user.invitedByUserId },
      select: { id: true, email: true },
    });
    if (!recipient) {
      return NextResponse.json({ error: "Contact d'invitation introuvable" }, { status: 400 });
    }

    const last = await prisma.activationRequest.findFirst({
      where: { requesterId: user.id, recipientId: recipient.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (last && Date.now() - last.createdAt.getTime() < MIN_INTERVAL_MS) {
      return NextResponse.json(
        {
          error:
            "Une demande a déjà été envoyée récemment. Merci de patienter avant de renouveler.",
        },
        { status: 429 },
      );
    }

    await prisma.activationRequest.create({
      data: {
        requesterId: user.id,
        recipientId: recipient.id,
      },
    });

    const webhook = process.env.ACTIVATION_REQUEST_WEBHOOK_URL;
    if (webhook) {
      const payload = {
        type: "activation_request" as const,
        requester: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        recipientUserId: recipient.id,
      };
      try {
        await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (hookErr) {
        console.error("[activation-request] webhook failed", hookErr);
      }
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
