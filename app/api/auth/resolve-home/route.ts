import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ensureBootstrapAdminInDb } from "@/lib/auth-redirect";
import { getAppUserByClerkId } from "@/lib/app-user";
import { dashboardPathForRole, isAdmin } from "@/lib/roles";

/**
 * Client-side fallback when server `/auth/continue` cannot reach the DB (cold start,
 * transient Neon errors). Returns the admin home path when the signed-in user is an admin.
 */
export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
	}

	let user = await getAppUserByClerkId(userId);
	try {
		user = (await ensureBootstrapAdminInDb(userId)) ?? user;
	} catch (err) {
		console.error("[api/auth/resolve-home] ensureBootstrapAdminInDb failed", err);
	}

	if (user?.role && (user.status === "ACTIVE" || isAdmin(user.role))) {
		return NextResponse.json({ redirectTo: dashboardPathForRole(user.role) });
	}

	try {
		const client = await clerkClient();
		const clerkUser = await client.users.getUser(userId);
		const pm = clerkUser.publicMetadata as { sokaRole?: string; role?: string };
		const role = pm.sokaRole ?? pm.role;
		if (role === "ADMIN") {
			return NextResponse.json({ redirectTo: "/admin" });
		}
	} catch (err) {
		console.error("[api/auth/resolve-home] clerk metadata read failed", err);
	}

	return NextResponse.json({ redirectTo: null });
}
