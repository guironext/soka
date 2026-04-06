import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncClerkAppMetadata } from "@/lib/clerk-sync";
import { shouldBootstrapAsAdmin } from "@/lib/user-bootstrap";

function primaryEmail(data: {
  primary_email_address_id?: string | null;
  email_addresses?: { id: string; email_address: string }[];
}): string {
  const primaryId = data.primary_email_address_id;
  const list = data.email_addresses ?? [];
  const primary = list.find((e) => e.id === primaryId);
  return primary?.email_address ?? list[0]?.email_address ?? "";
}

export async function POST(req: NextRequest) {
  const evt = await verifyWebhook(req);

  if (evt.type === "user.created") {
    const data = evt.data;
    const existing = await prisma.user.findUnique({
      where: { clerkId: data.id },
    });
    if (!existing) {
      const bootstrap = shouldBootstrapAsAdmin(data.id);
      const user = await prisma.user.create({
        data: {
          clerkId: data.id,
          email: primaryEmail(data).toLowerCase(),
          status: bootstrap ? "ACTIVE" : "PENDING_INVITATION",
          role: bootstrap ? "ADMIN" : null,
        },
      });
      await syncClerkAppMetadata(data.id, {
        status: user.status,
        role: user.role,
      });
    }
  }

  if (evt.type === "user.updated") {
    const data = evt.data;
    await prisma.user.updateMany({
      where: { clerkId: data.id },
      data: { email: primaryEmail(data).toLowerCase() },
    });
  }

  return new Response("ok", { status: 200 });
}
