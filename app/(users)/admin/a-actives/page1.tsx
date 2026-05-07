import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ClipboardSignature, Layers, Mail } from "lucide-react";
import type { AccountStatus, Role } from "@/app/generated/prisma";
import { ValidateLeaderButton } from "@/app/(users)/admin/a-actives/validate-leader-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAppUserByClerkId } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";
import { ADMIN_INVITATION_ROLE_OPTIONS, isAdmin, ROLE_RANK } from "@/lib/roles";

const LEADER_ROLES: Role[] = ["COMITE_NATIONAL", "CENTRE_GENERAL"];

const STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: "Actif",
  PENDING_APPROVAL: "En attente d’approbation",
  PENDING_INVITATION: "Invitation en attente",
};

function roleLabel(role: Role) {
  return (
    ADMIN_INVITATION_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role
  );
}

function displayName(
  email: string,
  firstName: string | null,
  lastName: string | null,
) {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || email;
}

function initials(
  email: string,
  firstName: string | null,
  lastName: string | null,
): string {
  const f = firstName?.trim().charAt(0);
  const l = lastName?.trim().charAt(0);
  if (f && l) return `${f}${l}`.toUpperCase();
  if (f) return f.toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export default async function AdminAActivesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const viewer = await getAppUserByClerkId(userId);
  if (!viewer || !isAdmin(viewer.role)) {
    redirect("/");
  }

  const rows = await prisma.user.findMany({
    where: {
      role: { in: LEADER_ROLES },
      pendingTargetRole: null,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      status: true,
    },
  });

  rows.sort((a, b) => {
    const ra = a.role ? ROLE_RANK[a.role] : 0;
    const rb = b.role ? ROLE_RANK[b.role] : 0;
    if (rb !== ra) {
      return rb - ra;
    }
    const keyA =
      `${a.lastName ?? ""}\t${a.firstName ?? ""}\t${a.email}`.toLowerCase();
    const keyB =
      `${b.lastName ?? ""}\t${b.firstName ?? ""}\t${b.email}`.toLowerCase();
    return keyA.localeCompare(keyB);
  });

  const countComiteNational = rows.filter(
    (r) => r.role === "COMITE_NATIONAL",
  ).length;
  const countCentreGeneral = rows.filter(
    (r) => r.role === "CENTRE_GENERAL",
  ).length;

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-emerald-500/25 bg-white/80 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700/90 dark:text-emerald-400/90">
                <Layers className="size-3.5" aria-hidden />
                Administration
              </p>
              <div className="border-l-4 border-emerald-500 pl-4">
                <h1
                  id="leaders-actifs-heading"
                  className="font-heading text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50"
                >
                  Actifs — comité national &amp; centres généraux
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Validez l&apos;accès des responsables : le bouton{" "}
                  <span className="font-medium text-foreground">VALIDER</span>{" "}
                  aligne le compte (Clerk, statut actif, rôle cible).
                </p>
              </div>
            </div>

            <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 sm:max-w-none sm:flex-wrap sm:overflow-visible sm:pb-0">
              <div className="min-w-22 shrink-0 snap-start rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="text-xl font-bold tabular-nums text-zinc-900 dark:text-white">
                  {rows.length}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Total
                </p>
              </div>
              <div className="min-w-22 shrink-0 snap-start rounded-lg border border-zinc-200 bg-white px-3 py-2 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
                <p className="text-xl font-bold tabular-nums text-zinc-900 dark:text-white">
                  {countComiteNational}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  C. nat.
                </p>
              </div>
              <div className="min-w-22 shrink-0 snap-start rounded-lg border border-zinc-200 bg-white px-3 py-2 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
                <p className="text-xl font-bold tabular-nums text-zinc-900 dark:text-white">
                  {countCentreGeneral}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  C. gén.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {rows.length === 0 ? (
          <Card className="flex flex-col items-center gap-5 border border-dashed border-zinc-300 px-8 py-16 text-center shadow-none dark:border-zinc-700">
            <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <ClipboardSignature className="size-6" aria-hidden />
            </span>
            <div className="max-w-md space-y-2">
              <p className="font-heading text-lg font-semibold">Liste vide</p>
              <p className="text-sm text-muted-foreground">
                Aucun dirigeant ne correspond aux critères pour le moment.
              </p>
            </div>
          </Card>
        ) : (
          <ul
            aria-labelledby="leaders-actifs-heading"
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            {rows.map((u) => {
              const name = displayName(u.email, u.firstName, u.lastName);
              const initialsStr = initials(
                u.email,
                u.firstName,
                u.lastName,
              );
              return (
                <li
                  key={u.id}
                  className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800/90"
                >
                  <article className="group flex flex-col gap-5 p-4 transition-colors hover:bg-zinc-50/90 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-4 sm:p-5 md:flex-nowrap lg:gap-x-10 dark:hover:bg-zinc-800/50">
                    <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                      <span
                        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-100 to-teal-100 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-500/25 dark:from-emerald-950 dark:to-teal-950 dark:text-emerald-200 dark:ring-emerald-500/20"
                        aria-hidden
                      >
                        {initialsStr}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h2 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                          {name}
                        </h2>
                        <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="size-3.5 shrink-0 opacity-60" aria-hidden />
                          <span className="truncate">{u.email}</span>
                        </p>
                      </div>
                    </div>

                    <p className="text-sm tabular-nums text-muted-foreground sm:w-40 sm:shrink-0 lg:w-44 lg:text-end">
                      <span className="text-muted-foreground sm:hidden">
                        Tél.&nbsp;
                      </span>
                      {u.phone ?? "—"}
                    </p>

                    <div className="flex w-full flex-col gap-3 sm:ml-auto sm:w-auto md:flex-row md:items-center md:justify-end md:gap-4">
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Badge
                          variant="outline"
                          className="border-emerald-600/35 bg-emerald-500/7 font-normal text-emerald-950 hover:bg-emerald-500/12 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-50"
                        >
                          {u.role ? roleLabel(u.role) : "—"}
                        </Badge>
                        <Badge
                          variant={
                            u.status === "ACTIVE" ? "default" : "secondary"
                          }
                          className="font-normal"
                        >
                          {STATUS_LABELS[u.status]}
                        </Badge>
                      </div>
                      <ValidateLeaderButton userId={u.id} className="w-full md:w-auto" />
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
