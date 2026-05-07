import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppUserByClerkId, requireClerkAuth } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(120),
  lastName: z.string().trim().min(1, "Nom requis").max(120),
  phone: z.string().trim().min(1, "Téléphone requis").max(40),
});

export async function PATCH(req: Request) {
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

  const user = await getAppUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: "Compte non provisionné" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
      phone: parsed.data.phone.trim(),
    },
  });

  return NextResponse.json({ ok: true });
}
