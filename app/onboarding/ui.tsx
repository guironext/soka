"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AccountStatus, Role } from "@/app/generated/prisma";

type Props = {
  status: AccountStatus;
  pendingTargetRole: Role | null;
  requiredApproverRoles: [Role, Role] | null;
  missingApproverRoles: Role[] | null;
};

function roleLabel(r: Role): string {
  return r.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function OnboardingClient({
  status,
  pendingTargetRole,
  requiredApproverRoles,
  missingApproverRoles,
}: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Could not redeem code");
        return;
      }
      setCode("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (status === "PENDING_INVITATION") {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Invitation code</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Enter the code you received from your inviter.
        </p>
        <form onSubmit={redeem} className="mt-4 flex flex-col gap-3">
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            placeholder="Paste code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {loading ? "Submitting…" : "Submit code"}
          </button>
          {message ? <p className="text-sm text-red-600 dark:text-red-400">{message}</p> : null}
        </form>
      </section>
    );
  }

  if (status === "PENDING_APPROVAL" && pendingTargetRole) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/30">
        <h2 className="text-lg font-medium text-amber-950 dark:text-amber-100">
          Waiting for validation
        </h2>
        <p className="mt-2 text-sm text-amber-900/80 dark:text-amber-200/80">
          Target role: <strong>{roleLabel(pendingTargetRole)}</strong>
        </p>
        {requiredApproverRoles ? (
          <p className="mt-2 text-sm text-amber-900/80 dark:text-amber-200/80">
            Required approvers (two distinct members):{" "}
            <strong>{roleLabel(requiredApproverRoles[0])}</strong> and{" "}
            <strong>{roleLabel(requiredApproverRoles[1])}</strong>.
          </p>
        ) : null}
        {missingApproverRoles?.length ? (
          <p className="mt-3 text-sm font-medium text-amber-950 dark:text-amber-100">
            Still needed: {missingApproverRoles.map(roleLabel).join(", ")}
          </p>
        ) : null}
        <p className="mt-4 text-xs text-amber-800/70 dark:text-amber-200/60">
          After you are approved, refresh the page or sign out and back in if you are not redirected
          immediately (Clerk session claims update on refresh).
        </p>
      </section>
    );
  }

  return null;
}
