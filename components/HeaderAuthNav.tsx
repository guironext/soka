"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function HeaderAuthNav() {
  return (
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
        <Link href="/auth/continue" className="text-zinc-700 dark:text-zinc-300">
          Mon espace
        </Link>
        <UserButton />
      </Show>
    </nav>
  );
}
