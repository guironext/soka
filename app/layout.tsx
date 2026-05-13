import type { Metadata } from "next";
import { frFR } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { HeaderAuthNav } from "@/components/HeaderAuthNav";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={frFR}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      unsafe_disableDevelopmentModeConsoleWarning={clerkPublishableKey.startsWith(
        "pk_test_",
      )}
    >
      <html
        lang="fr"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body
          className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50"
          suppressHydrationWarning
        >
          <TooltipProvider delayDuration={0}>
            <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <Link href="/" className="font-semibold tracking-tight uppercase">
                Soka Gakkai Côte d&apos;Ivoire
              </Link>
              <HeaderAuthNav />
            </header>
            <div className="flex flex-1 flex-col">{children}</div>
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
