import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { User } from "@/app/generated/prisma";
import { getAppUserByClerkId } from "@/lib/app-user";
import type { SokaPublicMetadata } from "@/lib/clerk-sync";
import { syncClerkAppMetadata } from "@/lib/clerk-sync";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole, isAdmin, normalizeJwtRole } from "@/lib/roles";
import { shouldBootstrapAsAdmin } from "@/lib/user-bootstrap";

async function clerkUserEmail(clerkId: string): Promise<string> {
	const client = await clerkClient();
	const clerkUser = await client.users.getUser(clerkId);
	return (
		clerkUser.primaryEmailAddress?.emailAddress ??
		clerkUser.emailAddresses[0]?.emailAddress ??
		""
	).toLowerCase();
}

async function roleFromClerkPublicMetadata(
	clerkId: string,
): Promise<ReturnType<typeof normalizeJwtRole>> {
	const client = await clerkClient();
	const clerkUser = await client.users.getUser(clerkId);
	const pm = clerkUser.publicMetadata as SokaPublicMetadata & { role?: string };
	return normalizeJwtRole(pm.sokaRole ?? pm.role);
}

/** Re-link prod Clerk account when the same e-mail already has an ADMIN row (dev vs prod Clerk IDs). */
async function relinkAdminRowByEmail(
	clerkId: string,
	email: string,
): Promise<User | null> {
	if (!email) return null;

	const existing = await prisma.user.findFirst({
		where: {
			email: email.toLowerCase(),
			role: "ADMIN",
		},
	});

	if (!existing || existing.clerkId === clerkId) {
		return existing;
	}

	return prisma.user.update({
		where: { id: existing.id },
		data: { clerkId, status: "ACTIVE", role: "ADMIN" },
	});
}

/** Ensures bootstrap Clerk IDs / e-mails have an ACTIVE ADMIN row (webhook may be missing in prod). */
export async function ensureBootstrapAdminInDb(
	clerkId: string,
): Promise<User | null> {
	let email: string;
	try {
		email = await clerkUserEmail(clerkId);
	} catch (err) {
		console.error("[ensureBootstrapAdminInDb] clerkUserEmail failed", err);
		return null;
	}

	let user = await getAppUserByClerkId(clerkId);
	if (user?.role === "ADMIN") return user;

	if (shouldBootstrapAsAdmin(clerkId, email)) {
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
					email,
					status: "ACTIVE",
					role: "ADMIN",
				},
			});
		}
	} else {
		user = (await relinkAdminRowByEmail(clerkId, email)) ?? user;
	}

	if (!user || user.role !== "ADMIN") {
		return user;
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
	let user: User | null = null;

	try {
		user = await getAppUserByClerkId(clerkId);
	} catch (err) {
		console.error("[auth-redirect] getAppUserByClerkId failed", err);
	}

	if (!user?.role || user.role !== "ADMIN") {
		try {
			user = (await ensureBootstrapAdminInDb(clerkId)) ?? user;
		} catch (err) {
			console.error("[auth-redirect] ensureBootstrapAdminInDb failed", err);
		}
	}

	if (user?.role && (user.status === "ACTIVE" || isAdmin(user.role))) {
		return dashboardPathForRole(user.role);
	}

	try {
		const clerkRole = await roleFromClerkPublicMetadata(clerkId);
		if (clerkRole) {
			return dashboardPathForRole(clerkRole);
		}
	} catch (err) {
		console.error("[auth-redirect] roleFromClerkPublicMetadata failed", err);
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

	let user: User | null = null;
	try {
		user = await getAppUserByClerkId(clerkId);
	} catch (err) {
		console.error("[auth-redirect] getAppUserByClerkId failed", err);
	}

	if (user?.status === "PENDING_APPROVAL") {
		redirect("/dashboard");
	}

	redirect("/onboarding");
}
