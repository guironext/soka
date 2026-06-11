import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppUserByClerkId, requireClerkAuth } from "@/lib/app-user";
import { syncClerkAppMetadata } from "@/lib/clerk-sync";
import { prisma } from "@/lib/prisma";
import { shouldBootstrapAsAdmin } from "@/lib/user-bootstrap";

const bodySchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(120),
  lastName: z.string().trim().min(1, "Nom requis").max(120),
  phone: z.string().trim().min(1, "Téléphone requis").max(40),
});

function isUniqueConstraintError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "P2002"
  );
}

export async function POST(req: Request) {
  let clerkId: string;
  try {
    clerkId = await requireClerkAuth();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json({ error: "Validation échouée", fieldErrors }, { status: 400 });
  }

  const phone = parsed.data.phone.trim();
  const firstName = parsed.data.firstName.trim();
  const lastName = parsed.data.lastName.trim();

  let user = await getAppUserByClerkId(clerkId);
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { firstName, lastName, phone },
    });
    return NextResponse.json({ ok: true, role: user.role });
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkId);
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    return NextResponse.json({ error: "Aucune adresse e-mail sur votre compte Clerk" }, { status: 400 });
  }

  const bootstrap = shouldBootstrapAsAdmin(clerkId, email);

  try {
    user = await prisma.user.create({
      data: {
        clerkId,
        email: email.toLowerCase(),
        firstName,
        lastName,
        phone,
        status: bootstrap ? "ACTIVE" : "PENDING_INVITATION",
        role: bootstrap ? "ADMIN" : null,
      },
    });
  } catch (e) {
    if (!isUniqueConstraintError(e)) throw e;
    user = await getAppUserByClerkId(clerkId);
    if (!user) throw e;
    await prisma.user.update({
      where: { id: user.id },
      data: { firstName, lastName, phone },
    });
    return NextResponse.json({ ok: true, role: user.role });
  }

  try {
    await syncClerkAppMetadata(clerkId, {
      status: user.status,
      role: user.role,
      pendingTargetRole: user.pendingTargetRole ?? null,
    });
  } catch (err) {
    console.error("[api/user/register] syncClerkAppMetadata failed", err);
  }

  return NextResponse.json({ ok: true, role: user.role });
}
