import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { User } from "@/app/generated/prisma";
import { getAppUserByClerkId } from "@/lib/app-user";
import type { SokaPublicMetadata } from "@/lib/clerk-sync";
import { syncClerkAppMetadata } from "@/lib/clerk-sync";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole, isAdmin, normalizeJwtRole } from "@/lib/roles";
import { shouldBootstrapAsAdmin } from "@/lib/user-bootstrap";

async function roleFromClerkPublicMetadata(
	clerkId: string,
): Promise<ReturnType<typeof normalizeJwtRole>> {
	const client = await clerkClient();
	const clerkUser = await client.users.getUser(clerkId);
	const pm = clerkUser.publicMetadata as SokaPublicMetadata & { role?: string };
	return normalizeJwtRole(pm.sokaRole ?? pm.role);
}

/** Ensures bootstrap Clerk IDs have an ACTIVE ADMIN row (webhook may be missing in prod). */
export async function ensureBootstrapAdminInDb(
	clerkId: string,
): Promise<User | null> {
	const client = await clerkClient();
	const clerkUser = await client.users.getUser(clerkId);
	const email =
		clerkUser.primaryEmailAddress?.emailAddress ??
		clerkUser.emailAddresses[0]?.emailAddress ??
		"";

	if (!shouldBootstrapAsAdmin(clerkId, email)) return null;

	let user = await getAppUserByClerkId(clerkId);
	if (user?.role === "ADMIN") return user;

	if (!email) return user;

	if (user) {
		user = await prisma.user.update({
			where: { id: user.id },
			data: { role: "ADMIN", status: "ACTIVE" },
		});
	} else {
		user = await prisma.user.create({
			data: {
				clerkId,
				email: email.toLowerCase(),
				status: "ACTIVE",
				role: "ADMIN",
			},
		});
	}

	try {
		await syncClerkAppMetadata(clerkId, {
			status: user.status,
			role: user.role,
			pendingTargetRole: user.pendingTargetRole ?? null,
		});
	} catch (err) {
		console.error("[ensureBootstrapAdminInDb] syncClerkAppMetadata failed", err);
	}

	return user;
}

async function resolveRoleHomePath(clerkId: string): Promise<string | null> {
	let user = await getAppUserByClerkId(clerkId);

	if (!user?.role || user.role !== "ADMIN") {
		user = (await ensureBootstrapAdminInDb(clerkId)) ?? user;
	}

	if (user?.role && (user.status === "ACTIVE" || isAdmin(user.role))) {
		return dashboardPathForRole(user.role);
	}

	const clerkRole = await roleFromClerkPublicMetadata(clerkId);
	if (clerkRole) {
		return dashboardPathForRole(clerkRole);
	}

	return null;
}

/** Redirect when the user already has a known role home (onboarding, dashboard, etc.). */
export async function redirectIfReadyForRoleHome(clerkId: string): Promise<void> {
	const home = await resolveRoleHomePath(clerkId);
	if (home) redirect(home);
}

/** Post sign-in router: role workspace, waiting room, or onboarding. */
export async function redirectSignedInUserToHome(clerkId: string): Promise<never> {
	const home = await resolveRoleHomePath(clerkId);
	if (home) redirect(home);

	const user = await getAppUserByClerkId(clerkId);
	if (user?.status === "PENDING_APPROVAL") {
		redirect("/dashboard");
	}

	redirect("/onboarding");
}
