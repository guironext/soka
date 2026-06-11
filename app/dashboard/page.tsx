import Image from "next/image";
import { Clock } from "lucide-react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { redirectIfReadyForRoleHome } from "@/lib/auth-redirect";
import { getAppUserByClerkId } from "@/lib/app-user";
import {
  ROLES_WITH_PENDING_TARGET_REDIRECT,
  dashboardPathForRole,
} from "@/lib/roles";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function accessAccountAction() {
  "use server";
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  const fresh = await getAppUserByClerkId(userId);
  if (
    fresh?.role &&
    fresh.pendingTargetRole &&
    fresh.role === fresh.pendingTargetRole
  ) {
    redirect(dashboardPathForRole(fresh.role));
  }
  redirect("/dashboard");
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  await redirectIfReadyForRoleHome(userId);

  const appUser = await getAppUserByClerkId(userId);
  const clerkUser = appUser ? null : await currentUser();

  const fullName =
    [appUser?.firstName, appUser?.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser?.fullName?.trim() ||
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() ||
    appUser?.email ||
    clerkUser?.primaryEmailAddress?.emailAddress ||
    "";

  const appRole = appUser?.role;
  const pendingTargetRole = appUser?.pendingTargetRole;
  const showAccessAccount =
    appRole != null &&
    pendingTargetRole != null &&
    ROLES_WITH_PENDING_TARGET_REDIRECT.has(appRole);

  return (
    <main className="relative flex min-h-[min(100svh,calc(100vh-4rem))] flex-1 flex-col items-center justify-center overflow-x-hidden px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-1/4 top-[-20%] h-[min(520px,80vw)] w-[min(520px,90vw)] rounded-full bg-linear-to-br from-zinc-200/60 via-transparent to-transparent blur-3xl dark:from-zinc-700/25" />
        <div className="absolute -right-1/4 bottom-[-15%] h-[min(480px,75vw)] w-[min(480px,85vw)] rounded-full bg-linear-to-tl from-amber-200/25 via-transparent to-transparent blur-3xl dark:from-amber-900/15" />
        <div className="absolute left-1/2 top-1/2 h-px max-w-xl -translate-x-1/2 -translate-y-1/2 bg-linear-to-r from-transparent via-zinc-300/40 to-transparent dark:via-zinc-600/30" />
      </div>

      <div className="relative z-10 w-full max-w-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-500 sm:max-w-lg">
        <Card className="gap-0 rounded-3xl border-zinc-200/90 bg-white/90 py-0 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(0,0,0,0.08)] backdrop-blur-sm ring-1 ring-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-900/80 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04),0_12px_40px_-12px_rgba(0,0,0,0.45)] dark:ring-zinc-800">
          <CardHeader className="flex flex-col items-center gap-5 border-b border-zinc-200/80 px-6 pb-8 pt-8 text-center dark:border-zinc-800 sm:gap-6 sm:px-10 sm:pb-10 sm:pt-10">
            <div className="flex h-29 w-29 shrink-0 items-center justify-center rounded-[1.375rem] bg-linear-to-br from-zinc-50 to-zinc-100/80 ring-1 ring-zinc-200/90 shadow-inner dark:from-zinc-950 dark:to-zinc-900/90 dark:ring-zinc-800 sm:h-33 sm:w-33 sm:rounded-2xl">
              <Image
                src="/logo.png"
                alt="COMMUNAUTE"
                width={240}
                height={240}
                className="h-19 w-auto max-w-33 object-contain sm:h-22 sm:max-w-35"
                priority
              />
            </div>

            
            <div className="space-y-2">
              <h1 className="text-balance font-heading text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl lg:text-[2rem] dark:text-zinc-50">
                Bienvenue
              </h1>
              {fullName ? (
                <h2 className="text-balance font-heading text-lg font-medium tracking-tight text-zinc-700 sm:text-xl dark:text-zinc-300">
                  {fullName}
                </h2>
              ) : null}
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Nous sommes ravis de vous accueillir dans l&apos;espace membres
                de la Soka Gakkai Côte d&apos;Ivoire.
              </p>
            </div>
          </CardHeader>

          {showAccessAccount ? (
            <CardContent className="flex justify-center px-6 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-8">
              <form action={accessAccountAction}>
                <Button type="submit" size="lg" className="min-w-56 rounded-xl">
                  Accéder à mon compte
                </Button>
              </form>
            </CardContent>
          ) : (
            <>
              <CardContent className="space-y-4 px-6 pb-6 pt-6 text-center sm:space-y-5 sm:px-10 sm:pb-8 sm:pt-8">
                <p className="text-pretty text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
                  Vous êtes désormais inscrit : votre tableau de bord personnel
                  s&apos;ouvrira pleinement dès que votre accès aura été validé.
                </p>
                <p className="text-pretty text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
                  Prochainement, votre{" "}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    responsable
                  </span>{" "}
                  autorisera l&apos;accès à votre compte. Vous pourrez alors
                  utiliser les fonctionnalités qui vous sont destinées.
                </p>
              </CardContent>

              <CardFooter className="flex flex-col items-center gap-1 border-t border-zinc-200/80 bg-zinc-50/80 px-6 py-5 text-center dark:border-zinc-800 dark:bg-zinc-950/50 sm:flex-row sm:justify-center sm:gap-3 sm:px-10 sm:py-6">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-amber-700 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-900 dark:text-amber-400 dark:ring-zinc-700">
                  <Clock aria-hidden className="size-4" strokeWidth={2} />
                </span>
                <p className="max-w-sm text-pretty text-xs leading-relaxed text-muted-foreground sm:text-left sm:text-sm">
                  <span className="font-medium text-foreground">
                    Activation en cours
                  </span>
                  <span className="hidden sm:inline"> — </span>
                  <span className="block sm:inline">
                    Revenez plus tard ou contactez votre responsable en cas de
                    question.
                  </span>
                </p>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
