"use client";

import { useMemo, useState } from "react";
import { Mail, Phone, Search } from "lucide-react";
import type { AccountStatus, Role } from "@/app/generated/prisma";
import { AccountStatus as AccountStatusEnum } from "@/app/generated/prisma";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRowActions } from "@/app/(users)/admin/liste-des-utilisateurs/user-row-actions";
import { ADMIN_INVITATION_ROLE_OPTIONS } from "@/lib/roles";

const STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: "Actif",
  PENDING_APPROVAL: "En attente d’approbation",
  PENDING_INVITATION: "Invitation en attente",
};

export type ListeUserRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: Role | null;
  status: AccountStatus;
};

function roleLabel(role: Role) {
  return (
    ADMIN_INVITATION_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role
  );
}

function personLabel(u: ListeUserRow) {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.email;
}

function initials(u: ListeUserRow): string {
  const f = u.firstName?.trim().charAt(0);
  const l = u.lastName?.trim().charAt(0);
  if (f && l) return `${f}${l}`.toUpperCase();
  if (f) return f.toUpperCase();
  return u.email.slice(0, 2).toUpperCase();
}

function statusBadgeClass(status: AccountStatus) {
  if (status === AccountStatusEnum.ACTIVE) {
    return "border-emerald-500/35 bg-emerald-500/10 font-normal text-emerald-950 hover:bg-emerald-500/15 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-50";
  }
  if (status === AccountStatusEnum.PENDING_APPROVAL) {
    return "border-amber-500/40 bg-amber-500/10 font-normal text-amber-950 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-50";
  }
  return "font-normal";
}

function matchesQuery(u: ListeUserRow, q: string): boolean {
  if (!q) return true;
  const roleStr = u.role ? roleLabel(u.role).toLowerCase() : "";
  const roleRaw = (u.role ?? "").toLowerCase();
  const parts = [
    personLabel(u),
    u.email,
    u.phone ?? "",
    roleStr,
    roleRaw,
    STATUS_LABELS[u.status],
  ];
  return parts.some((p) => p.toLowerCase().includes(q));
}

type UsersTableWithSearchProps = {
  users: ListeUserRow[];
};

export function UsersTableWithSearch({ users }: UsersTableWithSearchProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => matchesQuery(u, q));
  }, [users, query]);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/70 shadow-lg shadow-zinc-900/8 ring-1 ring-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-950/55 dark:shadow-black/50 dark:ring-zinc-800/80">
      <div className="border-b border-zinc-200/90 bg-linear-to-br from-zinc-50/95 via-white to-blue-50/40 px-4 py-4 dark:border-zinc-800 dark:from-zinc-900/80 dark:via-zinc-950 dark:to-blue-950/25 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0 space-y-1">
            <h2 className="font-heading text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Recherche
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Filtrez par nom, email, téléphone, rôle ou libellé de statut.
            </p>
          </div>
          <div className="w-full shrink-0 sm:max-w-md lg:max-w-lg">
            <label className="relative block">
              <span className="sr-only">Filtrer les utilisateurs</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blue-600/70 dark:text-blue-400/80"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nom, email, téléphone, rôle…"
                className="h-11 rounded-xl border-zinc-200/90 bg-white/90 pl-10 pr-3 text-[15px] shadow-inner shadow-zinc-900/5 placeholder:text-muted-foreground/85 focus-visible:border-blue-400/60 focus-visible:ring-blue-500/25 sm:h-10 sm:text-sm dark:border-zinc-700 dark:bg-zinc-900/75 dark:shadow-inner dark:focus-visible:border-blue-500/50"
                autoComplete="off"
                spellCheck={false}
                aria-describedby="users-search-hint"
              />
            </label>
          </div>
        </div>
        <p
          id="users-search-hint"
          className="mt-3 text-xs text-muted-foreground sm:mt-4"
        >
          {query.trim() ? (
            <>
              <span className="font-semibold tabular-nums text-foreground">
                {filtered.length}
              </span>{" "}
              résultat{filtered.length === 1 ? "" : "s"}
              {filtered.length === 0
                ? " — élargissez ou corrigez votre recherche."
                : null}
            </>
          ) : (
            <>
              <span className="tabular-nums font-medium text-foreground">
                {users.length}
              </span>{" "}
              compte{users.length === 1 ? "" : "s"} affiché
              {users.length === 1 ? "" : "s"}.
            </>
          )}
        </p>
      </div>

      <ul
        className="lg:hidden divide-y divide-zinc-100 dark:divide-zinc-800"
        aria-label="Utilisateurs"
      >
        {filtered.length === 0 ? (
          <li className="px-4 py-14 text-center text-sm text-muted-foreground sm:px-6">
            {query.trim() ? (
              <>Aucun résultat pour « {query.trim()} ».</>
            ) : (
              <>Aucun utilisateur.</>
            )}
          </li>
        ) : (
          filtered.map((u) => (
            <li key={u.id} className="px-4 py-4 sm:px-6">
              <article className="flex gap-3.5">
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-blue-100 to-indigo-100 text-sm font-semibold text-blue-900 shadow-sm ring-1 ring-blue-500/15 dark:from-blue-950 dark:to-indigo-950 dark:text-blue-100 dark:ring-blue-500/25"
                  aria-hidden
                >
                  {initials(u)}
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                      {personLabel(u)}
                    </p>
                    <UserRowActions userId={u.id} layout="comfortable" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={statusBadgeClass(u.status)}
                    >
                      {STATUS_LABELS[u.status]}
                    </Badge>
                    {u.role ? (
                      <Badge variant="outline" className="font-normal">
                        {roleLabel(u.role)}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Mail
                      className="mt-0.5 size-3.5 shrink-0 opacity-70"
                      aria-hidden
                    />
                    <span className="min-w-0 break-all">{u.email}</span>
                  </p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone
                      className="size-3.5 shrink-0 opacity-70"
                      aria-hidden
                    />
                    <span className="tabular-nums">{u.phone ?? "—"}</span>
                  </p>
                  {!u.role ? (
                    <p className="text-xs text-muted-foreground">
                      Rôle non attribué
                    </p>
                  ) : null}
                </div>
              </article>
            </li>
          ))
        )}
      </ul>

      <div className="relative hidden lg:block">
        <p className="sr-only" aria-live="polite">
          {filtered.length} utilisateur
          {filtered.length === 1 ? "" : "s"} dans le tableau.
        </p>
        <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-200 bg-zinc-50/98 hover:bg-zinc-50/98 dark:border-zinc-800 dark:bg-zinc-900/95 dark:hover:bg-zinc-900/95">
                <TableHead className="whitespace-nowrap bg-zinc-50/98 pl-5 dark:bg-zinc-900/95">
                  Nom
                </TableHead>
                <TableHead className="min-w-50 bg-zinc-50/98 dark:bg-zinc-900/95">
                  Email
                </TableHead>
                <TableHead className="whitespace-nowrap bg-zinc-50/98 dark:bg-zinc-900/95">
                  Téléphone
                </TableHead>
                <TableHead className="min-w-35 whitespace-nowrap bg-zinc-50/98 dark:bg-zinc-900/95">
                  Rôle
                </TableHead>
                <TableHead className="whitespace-nowrap bg-zinc-50/98 dark:bg-zinc-900/95">
                  Statut
                </TableHead>
                <TableHead className="min-w-34 bg-zinc-50/98 pr-5 text-right dark:bg-zinc-900/95">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-14 text-center text-sm text-muted-foreground"
                  >
                    Aucun utilisateur ne correspond à « {query.trim()} ».
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow
                    key={u.id}
                    className="border-zinc-100 transition-colors hover:bg-zinc-50/80 dark:border-zinc-800/90 dark:hover:bg-zinc-900/40"
                  >
                    <TableCell className="max-w-56 pl-5 align-middle font-medium whitespace-normal">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                          aria-hidden
                        >
                          {initials(u)}
                        </span>
                        <span className="min-w-0">{personLabel(u)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-72 align-middle whitespace-normal break-all text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell className="align-middle tabular-nums text-muted-foreground">
                      {u.phone ?? "—"}
                    </TableCell>
                    <TableCell className="align-middle">
                      {u.role ? (
                        <Badge variant="outline" className="font-normal">
                          {roleLabel(u.role)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="align-middle">
                      <Badge
                        variant="outline"
                        className={statusBadgeClass(u.status)}
                      >
                        {STATUS_LABELS[u.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-5 align-middle">
                      <UserRowActions userId={u.id} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="border-t border-zinc-100 px-4 py-2 text-center text-[11px] leading-relaxed text-muted-foreground xl:hidden dark:border-zinc-800">
          Faites défiler horizontalement si des colonnes sont coupées.
        </p>
      </div>
    </div>
  );
}
