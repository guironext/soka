import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { redirectSignedInUserToHome } from "@/lib/auth-redirect";

export default async function AuthContinuePage() {
	const { userId } = await auth();
	if (!userId) {
		redirect("/sign-in");
	}

	await redirectSignedInUserToHome(userId);
}
