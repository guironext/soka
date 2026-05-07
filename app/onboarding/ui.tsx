"use client";

import { useSession } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { AccountStatus, Role } from "@/app/generated/prisma";
import { ADMIN_INVITATION_ROLE_OPTIONS, ALL_KNOWN_ROLES } from "@/lib/roles";

type Props = {
  status: AccountStatus;
};

function roleLabel(r: Role): string {
  return r.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function inviteRoleLineLabel(r: Role): string {
  return (
    ADMIN_INVITATION_ROLE_OPTIONS.find((o) => o.value === r)?.label ?? roleLabel(r)
  );
}

function roleFromQuery(value: string | null): Role | null {
  if (!value) return null;
  return (ALL_KNOWN_ROLES as readonly string[]).includes(value)
    ? (value as Role)
    : null;
}

export function OnboardingClient({ status }: Props) {
  const router = useRouter();
  const { session } = useSession();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const inviteRoleHint = roleFromQuery(searchParams.get("role"));
  const inviteEmailHint = searchParams.get("email")?.trim() ?? "";
  const inviteResponsabiliteHint = searchParams.get("responsabilite")?.trim() ?? "";

  useEffect(() => {
    const fromUrl = searchParams.get("code")?.trim();
    if (fromUrl) setCode(fromUrl);
  }, [searchParams]);

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/invitations/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { error?: string; redirectTo?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Impossible de valider ce code");
        return;
      }
      setCode("");
      if (typeof data.redirectTo === "string" && data.redirectTo.startsWith("/")) {
        await session?.reload();
        router.push(data.redirectTo);
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (status === "PENDING_INVITATION") {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Code d&apos;invitation</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Saisissez le code ou le lien que vous avez reçu de la personne qui vous invite.
        </p>
        {inviteRoleHint || inviteResponsabiliteHint || inviteEmailHint ? (
          <div className="mt-3 space-y-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-950 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100">
            {inviteRoleHint ? (
              <p>
                Invitation pour le rôle :{" "}
                <strong>{inviteRoleLineLabel(inviteRoleHint)}</strong>
              </p>
            ) : null}
            {inviteResponsabiliteHint ? (
              <p>
                Responsabilité : <strong>{inviteResponsabiliteHint}</strong>
              </p>
            ) : null}
            {inviteEmailHint ? (
              <p>
                Destinataire indiqué : <strong>{inviteEmailHint}</strong>
              </p>
            ) : null}
          </div>
        ) : null}
        <form onSubmit={redeem} className="mt-4 flex flex-col gap-3">
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            placeholder="Coller le code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {loading ? "Envoi…" : "Valider le code"}
          </button>
          {message ? <p className="text-sm text-red-600 dark:text-red-400">{message}</p> : null}
        </form>
      </section>
    );
  }

  return null;
}
