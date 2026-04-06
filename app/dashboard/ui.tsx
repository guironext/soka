"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Role } from "@/app/generated/prisma";

function roleLabel(r: Role): string {
  return r.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

type Props = { invitableRoles: Role[] };

export function DashboardClient({ invitableRoles }: Props) {
  const router = useRouter();
  const [targetRole, setTargetRole] = useState<Role | "">(
    invitableRoles[0] ?? "",
  );
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [subjectEmail, setSubjectEmail] = useState("");
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function createInvitation(e: React.FormEvent) {
    e.preventDefault();
    if (!targetRole) return;
    setLoadingInvite(true);
    setMsg(null);
    setCreatedCode(null);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole }),
      });
      const data = (await res.json()) as { code?: string; error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "Could not create invitation");
        return;
      }
      if (data.code) setCreatedCode(data.code);
      router.refresh();
    } finally {
      setLoadingInvite(false);
    }
  }

  async function approve(e: React.FormEvent) {
    e.preventDefault();
    setLoadingApprove(true);
    setMsg(null);
    try {
      const res = await fetch("/api/onboarding/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectEmail: subjectEmail.trim() }),
      });
      const data = (await res.json()) as {
        error?: string;
        activated?: boolean;
        missingApproverRoles?: Role[];
      };
      if (!res.ok) {
        setMsg(data.error ?? "Approval failed");
        return;
      }
      if (data.activated) {
        setMsg("Member is now active.");
        setSubjectEmail("");
      } else if (data.missingApproverRoles?.length) {
        setMsg(`Recorded. Still needed: ${data.missingApproverRoles.map(roleLabel).join(", ")}`);
      } else {
        setMsg("Approval recorded.");
      }
      router.refresh();
    } finally {
      setLoadingApprove(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Create invitation</h2>
        {invitableRoles.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Your role cannot issue invitations in this ladder.
          </p>
        ) : (
          <form onSubmit={createInvitation} className="mt-4 flex flex-col gap-3">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">
              Target role
              <select
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as Role)}
              >
                {invitableRoles.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={loadingInvite}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              {loadingInvite ? "Creating…" : "Generate code"}
            </button>
            {createdCode ? (
              <p className="rounded-md bg-zinc-100 p-3 font-mono text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                {createdCode}
              </p>
            ) : null}
          </form>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Approve pending member</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Enter the email of someone who redeemed an invitation and is waiting for validation. You must
          hold one of the two required approver roles for their target role.
        </p>
        <form onSubmit={approve} className="mt-4 flex flex-col gap-3">
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            type="email"
            placeholder="pending.member@email.com"
            value={subjectEmail}
            onChange={(e) => setSubjectEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={loadingApprove || !subjectEmail.trim()}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 dark:border-zinc-600 dark:text-zinc-100"
          >
            {loadingApprove ? "Submitting…" : "Submit approval"}
          </button>
        </form>
      </section>

      {msg ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{msg}</p> : null}
    </div>
  );
}
