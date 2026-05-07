import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sparkles, Users } from "lucide-react";
import type { AccountStatus, Role } from "@/app/generated/prisma";
import { AccountStatus as AccountStatusEnum } from "@/app/generated/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { UsersTableWithSearch } from "@/app/(users)/admin/liste-des-utilisateurs/users-table-with-search";
import { getAppUserByClerkId } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";
import { isAdmin, ROLE_RANK } from "@/lib/roles";

type UserRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: Role | null;
  status: AccountStatus;
};

function sortKey(u: UserRow) {
  return `${u.lastName ?? ""}\t${u.firstName ?? ""}\t${u.email}`.toLowerCase();
}

function sortRank(u: UserRow): number {
  return u.role != null ? ROLE_RANK[u.role] : -1;
}

export default async function AdminListeDesUtilisateursPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const viewer = await getAppUserByClerkId(userId);
  if (!viewer || !isAdmin(viewer.role)) {
    redirect("/");
  }

  const rows = await prisma.user.findMany({
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

  const sorted = [...rows].sort((a, b) => {
    const rb = sortRank(b);
    const ra = sortRank(a);
    if (rb !== ra) return rb - ra;
    return sortKey(a).localeCompare(sortKey(b));
  });

  const activeCount = rows.filter((r) => r.status === AccountStatusEnum.ACTIVE)
    .length;
  const pendingCount = rows.length - activeCount;
  const distinctRoles = new Set(
    rows.map((r) => r.role).filter((x): x is Role => x != null),
  ).size;

  return (
    <div className="relative min-h-full overflow-x-hidden bg-linear-to-br from-blue-50/90 via-white to-yellow-50/50 dark:from-zinc-950 dark:via-zinc-950 dark:to-black">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_8%_0%,rgba(37,99,235,0.18),transparent),radial-gradient(ellipse_75%_45%_at_92%_12%,rgba(234,179,8,0.14),transparent),radial-gradient(ellipse_65%_40%_at_50%_100%,rgba(99,102,241,0.1),transparent)] dark:bg-[radial-gradient(ellipse_100%_55%_at_8%_0%,rgba(37,99,235,0.22),transparent),radial-gradient(ellipse_75%_45%_at_92%_12%,rgba(234,179,8,0.08),transparent),radial-gradient(ellipse_65%_40%_at_50%_100%,rgba(99,102,241,0.12),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-14">
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-200/75 bg-white/95 px-5 py-7 shadow-lg shadow-blue-900/10 ring-1 ring-blue-500/10 backdrop-blur-sm dark:border-blue-900/45 dark:bg-zinc-950/92 dark:shadow-black/45 sm:px-8 sm:py-9">
          <div
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-blue-400/18 blur-3xl dark:bg-blue-600/14"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-12 size-48 rounded-full bg-yellow-300/22 blur-2xl dark:bg-yellow-500/10"
            aria-hidden
          />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="gap-1 border-blue-400/55 bg-linear-to-r from-blue-50 to-yellow-50/80 text-blue-950 shadow-sm dark:border-blue-500/45 dark:from-blue-950/60 dark:to-yellow-950/35 dark:text-yellow-100"
                >
                  <Sparkles
                    className="size-3.5 text-yellow-600 dark:text-yellow-400"
                    aria-hidden
                  />
                  Annuaire
                </Badge>
                <span className="hidden text-xs font-medium text-blue-900/85 sm:inline dark:text-blue-200/90">
                  Gestion des comptes
                </span>
              </div>

              <div className="space-y-3 border-l-4 border-blue-500 pl-4">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700/90 dark:text-blue-400/90">
                  <Users className="size-3.5 shrink-0" aria-hidden />
                  Administration
                </p>
                <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl lg:text-[1.75rem] dark:text-zinc-50">
                  Liste des utilisateurs
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Vue unique de tous les comptes, triés par hiérarchie de rôle
                  puis par nom. La recherche filtre instantanément ; sur mobile,
                  les fiches s’affichent en cartes pour une lecture confortable.
                </p>
              </div>
            </div>

            <div className="grid w-full shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto lg:max-w-md">
              <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/90 px-3 py-3.5 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900/55">
                <p className="text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {rows.length}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Total
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200/85 bg-emerald-50/90 px-3 py-3.5 text-center shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/45">
                <p className="text-xl font-bold tabular-nums text-emerald-900 dark:text-emerald-100">
                  {activeCount}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800/85 dark:text-emerald-300/85">
                  Actifs
                </p>
              </div>
              <div className="rounded-xl border border-amber-200/85 bg-amber-50/90 px-3 py-3.5 text-center shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40">
                <p className="text-xl font-bold tabular-nums text-amber-950 dark:text-amber-100">
                  {pendingCount}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900/85 dark:text-amber-200/85">
                  En cours
                </p>
              </div>
              <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/85 px-3 py-3.5 text-center shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/38">
                <p className="text-xl font-bold tabular-nums text-indigo-950 dark:text-indigo-100">
                  {distinctRoles}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-900/80 dark:text-indigo-200/80">
                  Rôles distincts
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-10">
          {rows.length === 0 ? (
            <Card className="overflow-hidden border-2 border-dashed border-zinc-300/90 bg-white/60 px-6 py-16 text-center shadow-none dark:border-zinc-600 dark:bg-zinc-950/40">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/80">
                <Users
                  className="size-7 text-zinc-400 dark:text-zinc-500"
                  aria-hidden
                />
              </div>
              <CardTitle className="text-base font-semibold">
                Aucun utilisateur
              </CardTitle>
              <CardDescription className="mx-auto mt-2 max-w-sm">
                La base ne contient encore aucun compte.
              </CardDescription>
            </Card>
          ) : (
            <UsersTableWithSearch users={sorted} />
          )}
        </div>
      </div>
    </div>
  );
}
