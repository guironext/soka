"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Clerk may hydrate a signed-in session on the client before `auth()` sees it on
 * the server. Resolve the post-login destination via API (DB + Clerk metadata).
 */
export function SignInAutoContinue() {
	const { isLoaded, isSignedIn } = useAuth();
	const router = useRouter();
	const ran = useRef(false);

	useEffect(() => {
		if (!isLoaded || !isSignedIn || ran.current) return;
		ran.current = true;

		void (async () => {
			try {
				const res = await fetch("/api/auth/resolve-home", { cache: "no-store" });
				if (res.ok) {
					const data = (await res.json()) as { redirectTo?: string | null };
					if (data.redirectTo?.startsWith("/")) {
						router.replace(data.redirectTo);
						return;
					}
				}
			} catch {
				// Fall through to server continue page.
			}
			router.replace("/auth/continue");
		})();
	}, [isLoaded, isSignedIn, router]);

	return null;
}
