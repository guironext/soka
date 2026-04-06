import { clerkClient } from "@clerk/nextjs/server";
import type { AccountStatus, Role } from "@/app/generated/prisma";

export type SokaPublicMetadata = {
  sokaStatus?: AccountStatus;
  sokaRole?: Role | null;
};

export async function syncClerkAppMetadata(
  clerkId: string,
  data: { status: AccountStatus; role: Role | null },
): Promise<void> {
  const client = await clerkClient();
  await client.users.updateUser(clerkId, {
    publicMetadata: {
      sokaStatus: data.status,
      sokaRole: data.role,
    },
  });
}
