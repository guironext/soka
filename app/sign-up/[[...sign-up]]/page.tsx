import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function SignUpPage() {
	return (
		<main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-12 sm:max-w-xl sm:py-16">
			<div className="rounded-3xl border border-zinc-200/90 bg-white p-8 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(0,0,0,0.08)] dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04),0_12px_40px_-12px_rgba(0,0,0,0.45)] sm:p-10">
				<div className="flex flex-col items-center gap-8 text-center">
					<div className="flex flex-col items-center gap-6">
						<div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-zinc-50 ring-1 ring-zinc-200/80 dark:bg-zinc-950 dark:ring-zinc-800 sm:h-32 sm:w-32">
							<Image
								src="/logo.png"
								alt="SOKA GAKKAI CÔTE D'IVOIRE"
								width={240}
								height={240}
								className="h-20 w-auto max-w-28 object-contain sm:h-24 sm:max-w-32"
								priority
							/>
						</div>
						<div className="space-y-2">
							<h1 className="text-balance text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
								SOKA GAKKAI CÔTE D&apos;IVOIRE
							</h1>
							<p className="mx-auto max-w-sm text-pretty text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
								Espace membres — créez votre compte pour accéder au tableau de
								bord et au parcours d&apos;intégration.
							</p>
						</div>
					</div>
					<SignUp
						routing="path"
						path="/sign-up"
						fallbackRedirectUrl="/onboarding"
						signInUrl="/sign-in"
						appearance={{
							elements: { rootBox: "mx-auto" },
						}}
					/>
				</div>
			</div>
		</main>
	);
}
