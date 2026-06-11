"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Clerk may hydrate a signed-in session on the client before `auth()` sees it on
 * the server. Bounce to the post-login router so admins are not stuck on /sign-in.
 */
export function SignInAutoContinue() {
	const { isLoaded, isSignedIn } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (isLoaded && isSignedIn) {
			router.replace("/auth/continue");
		}
	}, [isLoaded, isSignedIn, router]);

	return null;
}
