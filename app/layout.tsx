import type { Metadata } from "next";
import { frFR } from "@clerk/localizations";
import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Soka Hub — Espace membres",
  description:
    "Communication entre membres et organisation pour le territoire Soka Gakkai Côte d'Ivoire.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={frFR}>
      <html
        lang="fr"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body
          className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50"
          suppressHydrationWarning
        >
          <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <Link href="/" className="font-semibold tracking-tight">
              Soka Hub
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="text-zinc-700 dark:text-zinc-300"
                  >
                    Connexion
                  </button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <Link href="/dashboard" className="text-zinc-700 dark:text-zinc-300">
                  Tableau de bord
                </Link>
                <Link href="/onboarding" className="text-zinc-700 dark:text-zinc-300">
                  Intégration
                </Link>
                <UserButton />
              </Show>
            </nav>
          </header>
          <div className="flex flex-1 flex-col">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
