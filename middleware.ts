import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getClerkAuthorizedParties } from "@/lib/app-url";
import {
	normalizeJwtRole,
	ROLES_WITH_PENDING_TARGET_REDIRECT,
} from "@/lib/roles";

/** Single source of truth: role ↔ dashboard base path (no trailing wildcard — the guard adds it). */
const ROLE_ACCESS = [
	{ role: "ADMIN" as const, base: "/admin" },
	{ role: "COMITE_NATIONAL" as const, base: "/comite_national" },
	{ role: "REGION" as const, base: "/region" },
	{ role: "CENTRE_REGION" as const, base: "/centre_general" },
	{ role: "CENTRE" as const, base: "/centre" },
	{ role: "CHAPITRE" as const, base: "/chapitre" },
	{ role: "DISTRICT" as const, base: "/district" },
	{ role: "GROUPE" as const, base: "/groupe" },
	{ role: "SOUS_GROUPE" as const, base: "/sous_groupe" },
	{ role: "MEMBRE" as const, base: "/membre" },
	{
		role: "DEPARTMENT_COMITE_NATIONAL" as const,
		base: "/departement-comite-national",
	},
	{
		role: "DEPARTMENT_CENTRE_REGION" as const,
		base: "/departement-centre-general",
	},
	{ role: "DEPARTMENT_CENTRE" as const, base: "/departement-centre" },
	{ role: "DEPARTMENT_CHAPITRE" as const, base: "/departement-chapitre" },
	{ role: "DEPARTMENT_DISTRICT" as const, base: "/departement-district" },
	{ role: "DEPARTMENT_GROUPE" as const, base: "/departement-groupe" },
	{ role: "DEPARTMENT_SOUS_GROUPE" as const, base: "/departement-sous-groupe" },
	{ role: "DEPARTMENT_MEMBRE" as const, base: "/departement-membre" },
] as const;

type SokaRole = (typeof ROLE_ACCESS)[number]["role"];

const ROLE_HOME = Object.fromEntries(
	ROLE_ACCESS.map(({ role, base }) => [role, base]),
) as Record<SokaRole, string>;

const ROLE_ROUTE_GUARDS = ROLE_ACCESS.map(({ role, base }) => ({
	role,
	matches: createRouteMatcher([base, `${base}/(.*)`]),
}));

const isPublicRoute = createRouteMatcher([
	"/",
	"/sign-in(.*)",
	"/sign-up(.*)",
	"/api/webhooks/(.*)",
]);
const isOnboardingRoute = createRouteMatcher(["/onboarding"]);
const isAdminAppRoute = createRouteMatcher(["/admin", "/admin/(.*)"]);
/**
 * Non-admin role dashboards (and department mirrors). Same onboarding exemption as
 * {@link isAdminAppRoute}: JWT may lag; pages enforce access from the DB.
 */
const isRoleWorkspaceAppRoute = createRouteMatcher(
	ROLE_ACCESS.filter((r) => r.role !== "ADMIN").flatMap(({ base }) => [
		base,
		`${base}/(.*)`,
	]),
);
/**
 * Waiting room for `PENDING_APPROVAL` users (and the post-onboarding "Activation
 * en cours" screen). Reachable before Clerk `onboardingCompleted` is `true` —
 * authorization is enforced by the page against the DB, same pattern as
 * {@link isAdminAppRoute}. Without this exemption, /dashboard ↔ /onboarding loop.
 */
const isPendingDashboardRoute = createRouteMatcher([
	"/dashboard",
	"/dashboard/(.*)",
]);
/** Lets signed-in users complete onboarding APIs before session `onboardingCompleted` is true */
const isOnboardingSupportApi = createRouteMatcher([
	"/api/user/profile",
	"/api/user/register",
	"/api/invitations/redeem",
]);
/**
 * Approvals + issuing invitations + admin-only mutations: must be reachable before
 * Clerk `onboardingCompleted` is true. Authorization is enforced in each route
 * (DB role), not JWT — same idea as {@link isAdminAppRoute} where the UI trusts
 * the database when claims lag.
 *
 * Includes `/api/admin/(.*)` because admin POST routes (e.g. activate-user,
 * validate-leader) are invoked from the /admin UI and would otherwise be
 * 307-redirected to /onboarding for admins whose JWT hasn't yet picked up
 * `onboardingCompleted: true`.
 */
const isAdminSupportApi = createRouteMatcher([
	"/api/onboarding/approve",
	"/api/invitations",
	"/api/admin/(.*)",
	"/api/comite-national/(.*)",
]);

function redirect(req: NextRequest, pathname: string) {
	return NextResponse.redirect(new URL(pathname, req.url));
}

function homeForRole(role: SokaRole | undefined): string | null {
	if (!role || !(role in ROLE_HOME)) return null;
	return ROLE_HOME[role];
}

/** `ROLE_HOME` values are route-matcher patterns; strip `/(.*)` for real redirect pathnames. */
function redirectPathForRole(role: SokaRole | undefined): string | null {
	const base = homeForRole(role);
	if (!base) return null;
	return base.replace(/\/\(\.\*\)$/, "");
}

/**
 * JWT may expose the app role at one of three locations:
 *   - `metadata.sokaRole` (default — Clerk surfaces `publicMetadata` here)
 *   - `metadata.role` (legacy)
 *   - root `sokaRole` (only when the Clerk JWT template adds it, see env.template)
 */
function sokaRoleFromClaims(
	claims:
		| {
				metadata?: { sokaRole?: string; role?: string };
				sokaRole?: string | null;
		  }
		| null
		| undefined,
): SokaRole | undefined {
	if (!claims) return undefined;
	const fromMetaSoka = normalizeJwtRole(claims.metadata?.sokaRole);
	if (fromMetaSoka && fromMetaSoka in ROLE_HOME)
		return fromMetaSoka as SokaRole;
	const fromMetaLegacy = normalizeJwtRole(claims.metadata?.role);
	if (fromMetaLegacy && fromMetaLegacy in ROLE_HOME)
		return fromMetaLegacy as SokaRole;
	const fromRoot = normalizeJwtRole(claims.sokaRole);
	if (fromRoot && fromRoot in ROLE_HOME) return fromRoot as SokaRole;
	return undefined;
}

/** Pending invitation / approval target role (see `sokaPendingTargetRole` in env.template). */
function pendingTargetRoleFromClaims(
	claims:
		| {
				metadata?: { sokaPendingTargetRole?: string };
				sokaPendingTargetRole?: string | null;
		  }
		| null
		| undefined,
): SokaRole | undefined {
	if (!claims) return undefined;
	const fromMeta = normalizeJwtRole(claims.metadata?.sokaPendingTargetRole);
	if (fromMeta && fromMeta in ROLE_HOME) return fromMeta as SokaRole;
	const fromRoot = normalizeJwtRole(claims.sokaPendingTargetRole);
	if (fromRoot && fromRoot in ROLE_HOME) return fromRoot as SokaRole;
	return undefined;
}

function redirectForPendingTargetIfNeeded(
	req: NextRequest,
	appRole: SokaRole | undefined,
	pending: SokaRole | undefined,
): NextResponse | null {
	if (req.nextUrl.pathname.startsWith("/api")) return null;
	if (!appRole || !pending || !ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole))
		return null;
	const pendingGuard = ROLE_ROUTE_GUARDS.find((g) => g.role === pending);
	if (pendingGuard?.matches(req)) return null;
	const path = redirectPathForRole(pending);
	if (!path) return null;
	return redirect(req, path);
}

export default clerkMiddleware(
	async (auth, req: NextRequest) => {
		const { userId, sessionClaims, redirectToSignIn } = await auth();
		const md = sessionClaims?.metadata;
		const appRole = sokaRoleFromClaims(sessionClaims);
		const pendingRole = pendingTargetRoleFromClaims(sessionClaims);
		const { pathname } = req.nextUrl;

		// Dev diagnostics: see resolved role + raw claim shape per request.
		// Remove once Clerk JWT template is verified working.
		if (process.env.NODE_ENV !== "production") {
			const mdAny = md as
				| {
						sokaRole?: unknown;
						role?: unknown;
						sokaPendingTargetRole?: unknown;
				  }
				| undefined;
			console.log("[mw]", pathname, {
				userId,
				appRole,
				pendingRole,
				onboardingCompleted: md?.onboardingCompleted,
				rawSokaRoleRoot: (sessionClaims as { sokaRole?: unknown } | undefined)
					?.sokaRole,
				rawMetadataSokaRole: mdAny?.sokaRole,
				rawMetadataRole: mdAny?.role,
				rawMetadataSokaPendingTargetRole: mdAny?.sokaPendingTargetRole,
				claimKeys: sessionClaims ? Object.keys(sessionClaims) : null,
			});
		}

		/**
		 * App routes are all lowercase. If a request lands on a mixed-case path under one of
		 * our known role bases (e.g. `/admin/A-actives`, often typed by hand because the
		 * sidebar *labels* are capitalized), redirect to the canonical lowercase URL instead
		 * of letting Next.js return a 404. Skips API + Next internals to stay out of the way.
		 */
		if (
			pathname !== pathname.toLowerCase() &&
			!pathname.startsWith("/api") &&
			!pathname.startsWith("/_next") &&
			ROLE_ACCESS.some(({ base }) =>
				pathname.toLowerCase().startsWith(`${base}/`),
			)
		) {
			const normalized = req.nextUrl.clone();
			normalized.pathname = pathname.toLowerCase();
			return NextResponse.redirect(normalized);
		}

		if (userId && pathname === "/") {
			if (!md?.onboardingCompleted) {
				if (appRole === "ADMIN") {
					return redirect(req, "/admin");
				}
				return redirect(req, "/onboarding");
			}

			if (
				pendingRole &&
				appRole &&
				ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
			) {
				const pendingPath = redirectPathForRole(pendingRole);
				if (pendingPath) return redirect(req, pendingPath);
			}
			const homePath = redirectPathForRole(appRole);
			if (homePath) return redirect(req, homePath);
		}

		if (userId && pathname === "/") {
			if (!md?.onboardingCompleted) {
				if (appRole === "COMITE_NATIONAL") {
					return redirect(req, "/comite_national");
				}
				return redirect(req, "/onboarding");
			}

			if (
				pendingRole &&
				appRole &&
				ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
			) {
				const pendingPath = redirectPathForRole(pendingRole);
				if (pendingPath) return redirect(req, pendingPath);
			}
			const homePath = redirectPathForRole(appRole);
			if (homePath) return redirect(req, homePath);
		}

		if (userId && pathname === "/") {
			if (!md?.onboardingCompleted) {
				if (appRole === "REGION") {
					return redirect(req, "/region");
				}
				return redirect(req, "/onboarding");
			}

			if (
				pendingRole &&
				appRole &&
				ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
			) {
				const pendingPath = redirectPathForRole(pendingRole);
				if (pendingPath) return redirect(req, pendingPath);
			}
			const homePath = redirectPathForRole(appRole);
			if (homePath) return redirect(req, homePath);
		}

		if (userId && pathname === "/") {
			if (!md?.onboardingCompleted) {
				if (appRole === "CENTRE_REGION") {
					return redirect(req, "/centre_general");
				}
				return redirect(req, "/onboarding");
			}

			if (
				pendingRole &&
				appRole &&
				ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
			) {
				const pendingPath = redirectPathForRole(pendingRole);
				if (pendingPath) return redirect(req, pendingPath);
			}
			const homePath = redirectPathForRole(appRole);
			if (homePath) return redirect(req, homePath);
		}

		if (userId && pathname === "/") {
			if (!md?.onboardingCompleted) {
				if (appRole === "CENTRE") {
					return redirect(req, "/centre");
				}
				return redirect(req, "/onboarding");
			}

			if (
				pendingRole &&
				appRole &&
				ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
			) {
				const pendingPath = redirectPathForRole(pendingRole);
				if (pendingPath) return redirect(req, pendingPath);
			}
			const homePath = redirectPathForRole(appRole);
			if (homePath) return redirect(req, homePath);
		}

		if (userId && pathname === "/") {
			if (!md?.onboardingCompleted) {
				if (appRole === "CHAPITRE") {
					return redirect(req, "/chapitre");
				}
				return redirect(req, "/onboarding");
			}

			if (
				pendingRole &&
				appRole &&
				ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
			) {
				const pendingPath = redirectPathForRole(pendingRole);
				if (pendingPath) return redirect(req, pendingPath);
			}
			const homePath = redirectPathForRole(appRole);
			if (homePath) return redirect(req, homePath);
		}

		if (userId && pathname === "/") {
			if (!md?.onboardingCompleted) {
				if (appRole === "DISTRICT") {
					return redirect(req, "/district");
				}
				return redirect(req, "/onboarding");
			}

			if (
				pendingRole &&
				appRole &&
				ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
			) {
				const pendingPath = redirectPathForRole(pendingRole);
				if (pendingPath) return redirect(req, pendingPath);
			}
			const homePath = redirectPathForRole(appRole);
			if (homePath) return redirect(req, homePath);
		}

		if (userId && pathname === "/") {
			if (!md?.onboardingCompleted) {
				if (appRole === "GROUPE") {
					return redirect(req, "/groupe");
				}
				return redirect(req, "/onboarding");
			}

			if (
				pendingRole &&
				appRole &&
				ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
			) {
				const pendingPath = redirectPathForRole(pendingRole);
				if (pendingPath) return redirect(req, pendingPath);
			}
			const homePath = redirectPathForRole(appRole);
			if (homePath) return redirect(req, homePath);
		}

		if (userId && pathname === "/") {
			if (!md?.onboardingCompleted) {
				if (appRole === "SOUS_GROUPE") {
					return redirect(req, "/sous_groupe");
				}
				return redirect(req, "/onboarding");
			}

			if (
				pendingRole &&
				appRole &&
				ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
			) {
				const pendingPath = redirectPathForRole(pendingRole);
				if (pendingPath) return redirect(req, pendingPath);
			}
			const homePath = redirectPathForRole(appRole);
			if (homePath) return redirect(req, homePath);
		}

		if (userId && pathname === "/") {
			if (!md?.onboardingCompleted) {
				if (appRole === "MEMBRE") {
					return redirect(req, "/membre");
				}
				return redirect(req, "/onboarding");
			}

			if (
				pendingRole &&
				appRole &&
				ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
			) {
				const pendingPath = redirectPathForRole(pendingRole);
				if (pendingPath) return redirect(req, pendingPath);
			}
			const homePath = redirectPathForRole(appRole);
			if (homePath) return redirect(req, homePath);
		}

		if (isPublicRoute(req)) return NextResponse.next();

		if (!userId) {
			return redirectToSignIn({ returnBackUrl: req.url });
		}

		if (isOnboardingRoute(req)) {
			if (appRole === "ADMIN") {
				return redirect(req, "/admin");
			}
			if (req.nextUrl.searchParams.get("onboardingCompleted")) {
				let dest =
					pendingRole &&
					appRole &&
					ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
						? redirectPathForRole(pendingRole)
						: null;
				dest = dest ?? redirectPathForRole(appRole) ?? "/";
				return redirect(req, dest);
			}
			return NextResponse.next();
		}

		if (isOnboardingRoute(req)) {
			if (appRole === "COMITE_NATIONAL") {
				return redirect(req, "/comite_national");
			}
			if (req.nextUrl.searchParams.get("onboardingCompleted")) {
				let dest =
					pendingRole &&
					appRole &&
					ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
						? redirectPathForRole(pendingRole)
						: null;
				dest = dest ?? redirectPathForRole(appRole) ?? "/";
				return redirect(req, dest);
			}
			return NextResponse.next();
		}

		if (isOnboardingRoute(req)) {
			if (appRole === "CENTRE_REGION") {
				return redirect(req, "/centre_general");
			}
			if (req.nextUrl.searchParams.get("onboardingCompleted")) {
				let dest =
					pendingRole &&
					appRole &&
					ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
						? redirectPathForRole(pendingRole)
						: null;
				dest = dest ?? redirectPathForRole(appRole) ?? "/";
				return redirect(req, dest);
			}
			return NextResponse.next();
		}

		if (isOnboardingRoute(req)) {
			if (appRole === "CENTRE") {
				return redirect(req, "/centre");
			}
			if (req.nextUrl.searchParams.get("onboardingCompleted")) {
				let dest =
					pendingRole &&
					appRole &&
					ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
						? redirectPathForRole(pendingRole)
						: null;
				dest = dest ?? redirectPathForRole(appRole) ?? "/";
				return redirect(req, dest);
			}
			return NextResponse.next();
		}

		if (isOnboardingRoute(req)) {
			if (appRole === "CHAPITRE") {
				return redirect(req, "/chapitre");
			}
			if (req.nextUrl.searchParams.get("onboardingCompleted")) {
				let dest =
					pendingRole &&
					appRole &&
					ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
						? redirectPathForRole(pendingRole)
						: null;
				dest = dest ?? redirectPathForRole(appRole) ?? "/";
				return redirect(req, dest);
			}
			return NextResponse.next();
		}

		if (isOnboardingRoute(req)) {
			if (appRole === "DISTRICT") {
				return redirect(req, "/district");
			}
			if (req.nextUrl.searchParams.get("onboardingCompleted")) {
				let dest =
					pendingRole &&
					appRole &&
					ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
						? redirectPathForRole(pendingRole)
						: null;
				dest = dest ?? redirectPathForRole(appRole) ?? "/";
				return redirect(req, dest);
			}
			return NextResponse.next();
		}

		if (isOnboardingRoute(req)) {
			if (appRole === "GROUPE") {
				return redirect(req, "/groupe");
			}
			if (req.nextUrl.searchParams.get("onboardingCompleted")) {
				let dest =
					pendingRole &&
					appRole &&
					ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
						? redirectPathForRole(pendingRole)
						: null;
				dest = dest ?? redirectPathForRole(appRole) ?? "/";
				return redirect(req, dest);
			}
			return NextResponse.next();
		}

		if (isOnboardingRoute(req)) {
			if (appRole === "SOUS_GROUPE") {
				return redirect(req, "/sous_groupe");
			}
			if (req.nextUrl.searchParams.get("onboardingCompleted")) {
				let dest =
					pendingRole &&
					appRole &&
					ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
						? redirectPathForRole(pendingRole)
						: null;
				dest = dest ?? redirectPathForRole(appRole) ?? "/";
				return redirect(req, dest);
			}
			return NextResponse.next();
		}

		if (isOnboardingRoute(req)) {
			if (appRole === "MEMBRE") {
				return redirect(req, "/membre");
			}
			if (req.nextUrl.searchParams.get("onboardingCompleted")) {
				let dest =
					pendingRole &&
					appRole &&
					ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole)
						? redirectPathForRole(pendingRole)
						: null;
				dest = dest ?? redirectPathForRole(appRole) ?? "/";

				return redirect(req, dest);
			}
			return NextResponse.next();
		}

		if (isOnboardingSupportApi(req)) {
			return NextResponse.next();
		}

		if (isAdminSupportApi(req) && userId) {
			return NextResponse.next();
		}

		if (
			!md?.onboardingCompleted &&
			!isAdminAppRoute(req) &&
			!isRoleWorkspaceAppRoute(req) &&
			!isPendingDashboardRoute(req)
		) {
			return redirect(req, "/onboarding");
		}

		/** Admin UI authorizes by DB role in the page; JWT may lag after registration. */
		if (isAdminAppRoute(req)) {
			return NextResponse.next();
		}

		/**
		 * /dashboard is the post-onboarding waiting room for PENDING_APPROVAL users.
		 * The page authorizes against the DB and decides what to render or redirect.
		 */
		if (isPendingDashboardRoute(req)) {
			return NextResponse.next();
		}

		const pendingTargetRedirect = redirectForPendingTargetIfNeeded(
			req,
			appRole,
			pendingRole,
		);
		if (pendingTargetRedirect) return pendingTargetRedirect;

		/**
		 * JWT may lag right after an admin validation / approval (publicMetadata is updated
		 * but the session token hasn't refreshed yet). When the JWT carries no role, defer
		 * to the destination page, which authorizes against the DB and redirects if needed.
		 */
		for (const { role, matches } of ROLE_ROUTE_GUARDS) {
			if (!matches(req)) continue;
			if (!appRole) return NextResponse.next();
			return appRole === role ? NextResponse.next() : redirect(req, "/");
		}

		return NextResponse.next();
	},
	{
		signInUrl: "/sign-in",
		signUpUrl: "/sign-up",
		authorizedParties: getClerkAuthorizedParties(),
	},
);

export const config = {
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
	],
};
