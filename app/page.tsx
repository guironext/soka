import { Show } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-12 sm:max-w-xl sm:py-16">
      <div className="rounded-3xl border border-zinc-200/90 bg-white p-8 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(0,0,0,0.08)] dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04),0_12px_40px_-12px_rgba(0,0,0,0.45)] sm:p-10">
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-zinc-50 ring-1 ring-zinc-200/80 dark:bg-zinc-950 dark:ring-zinc-800 sm:h-32 sm:w-32">
              <Image
                src="/logo.png"
                alt="SOKA GAKKAI CÔTE D&apos;IVOIRE"
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
                Espace membres — connectez-vous pour accéder à votre tableau de bord et à votre
                parcours d&apos;intégration.
              </p>
            </div>
          </div>

          <Show when="signed-out">
            <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center sm:gap-3">
              <Link
                href="/sign-up"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 active:translate-y-px dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:focus-visible:outline-zinc-200"
              >
                S&apos;inscrire
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 active:translate-y-px dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:border-zinc-500 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-500"
              >
                Se connecter
              </Link>
            </div>
          </Show>

          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 w-full max-w-sm items-center justify-center rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 active:translate-y-px dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:focus-visible:outline-zinc-200"
            >
              Accéder au tableau de bord
            </Link>
          </Show>
        </div>
      </div>
    </main>
  );
}
