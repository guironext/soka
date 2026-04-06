import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@/app/generated/prisma";

export async function requireClerkAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}

export async function getAppUserByClerkId(clerkId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { clerkId } });
}

export type ActiveAppUser = User & { status: "ACTIVE"; role: NonNullable<User["role"]> };

export async function requireActiveAppUser(): Promise<ActiveAppUser> {
  const clerkId = await requireClerkAuth();
  const user = await getAppUserByClerkId(clerkId);
  if (!user || user.status !== "ACTIVE" || user.role == null) {
    const err = new Error("FORBIDDEN");
    (err as Error & { code: string }).code = "FORBIDDEN";
    throw err;
  }
  return user as ActiveAppUser;
}
