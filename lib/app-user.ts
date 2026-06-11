import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { User } from "@/app/generated/prisma";
import { dashboardPathForRole, isAdmin } from "@/lib/roles";

export async function requireClerkAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}

export async function getAppUserByClerkId(clerkId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { clerkId } });
}

/** Signed-in users with an active role go straight to their role workspace. */
export function redirectActiveUserToRoleHome(user: User | null | undefined): void {
  if (user?.status === "ACTIVE" && user.role != null) {
    redirect(dashboardPathForRole(user.role));
  }
}

/**
 * Admins skip onboarding/sign-in once their role is known (admin UI does not require ACTIVE).
 * Everyone else needs ACTIVE + role.
 */
export function redirectUserToRoleHome(user: User | null | undefined): void {
  if (!user?.role) return;
  if (user.status === "ACTIVE" || isAdmin(user.role)) {
    redirect(dashboardPathForRole(user.role));
  }
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
