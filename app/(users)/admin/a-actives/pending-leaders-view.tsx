"use client";

import { Clock, Mail, Phone } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import type { Role } from "@/app/generated/prisma";
import { ActivateUserButton } from "@/app/(users)/admin/a-actives/activate-user-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type PendingLeaderRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  pendingTargetRole: Role | null;
  createdAt: Date;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

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

type Props = {
  initialRows: PendingLeaderRow[];
  /** Small uppercase label above the title (e.g. section name). */
  sectionLabel?: string;
  /** Main H1; defaults to the admin wording. */
  pageHeading?: string;
  /** Subtitle under the title. */
  description?: ReactNode;
  /** Body text when the table is empty. */
  emptyStateDescription?: string;
  /** `id` for the heading (table `aria-labelledby`). */
  headingId?: string;
  /** When false, hides the Action column. */
  showActivateColumn?: boolean;
  /** POST URL for the activate button (default: `/api/admin/activate-user`). */
  activateEndpoint?: string;
  /** Button label (default: `ACTIVER`). */
  activateButtonLabel?: string;
};

export function PendingLeadersView({
  initialRows,
  sectionLabel = "Administration",
  pageHeading = "Comptes en attente d'approbation",
  description = (
    <>
      Utilisateurs au statut{" "}
      <span className="font-medium text-foreground">PENDING_APPROVAL</span> qui
      n&apos;ont pas encore de rôle attribué.
    </>
  ),
  emptyStateDescription = "Aucun utilisateur n'a le statut «\u00a0PENDING_APPROVAL\u00a0» sans rôle attribué.",
  headingId = "a-actives-pending-heading",
  showActivateColumn = true,
  activateEndpoint,
  activateButtonLabel,
}: Props) {
  const [rows, setRows] = useState(initialRows);

  const handleActivated = useCallback((userId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== userId));
  }, []);

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-amber-500/25 bg-white/80 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700/90 dark:text-amber-400/90">
                <Clock className="size-3.5" aria-hidden />
                {sectionLabel}
              </p>
              <div className="border-l-4 border-amber-500 pl-4">
                <h1
                  id={headingId}
                  className="font-heading text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50"
                >
                  {pageHeading}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
              <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">
                {rows.length}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                À traiter
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {rows.length === 0 ? (
          <Card className="flex flex-col items-center gap-5 border border-dashed border-zinc-300 px-8 py-16 text-center shadow-none dark:border-zinc-700">
            <span className="flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <Clock className="size-6" aria-hidden />
            </span>
            <div className="max-w-md space-y-2">
              <p className="font-heading text-lg font-semibold">
                Aucune demande en attente
              </p>
              <p className="text-sm text-muted-foreground">
                {emptyStateDescription}
              </p>
            </div>
          </Card>
        ) : (
          <Card
            aria-labelledby={headingId}
            className="overflow-hidden border-zinc-200 bg-white p-0 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/80 hover:bg-zinc-50/80 dark:bg-zinc-900/60 dark:hover:bg-zinc-900/60">
                  <TableHead className="pl-4">Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Rôle cible</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  {showActivateColumn ? (
                    <TableHead className="pr-4 text-right">Action</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((u) => {
                  const name = displayName(u.email, u.firstName, u.lastName);
                  const initialsStr = initials(
                    u.email,
                    u.firstName,
                    u.lastName,
                  );
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-amber-100 to-orange-100 text-xs font-semibold text-amber-900 ring-1 ring-amber-500/25 dark:from-amber-950 dark:to-orange-950 dark:text-amber-200 dark:ring-amber-500/20"
                            aria-hidden
                          >
                            {initialsStr}
                          </span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">
                            {name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail
                            className="size-3.5 shrink-0 opacity-60"
                            aria-hidden
                          />
                          {u.email}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums text-muted-foreground">
                        {u.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone
                              className="size-3.5 shrink-0 opacity-60"
                              aria-hidden
                            />
                            {u.phone}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {u.pendingTargetRole ? (
                          <Badge
                            variant="outline"
                            className="border-amber-600/35 bg-amber-500/7 font-normal text-amber-950 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-50"
                          >
                            {u.pendingTargetRole}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums text-muted-foreground">
                        {dateFormatter.format(u.createdAt)}
                      </TableCell>
                      {showActivateColumn ? (
                        <TableCell className="pr-4 text-right">
                          <div className="flex justify-end">
                            <ActivateUserButton
                              userId={u.id}
                              disabled={!u.pendingTargetRole}
                              onActivated={handleActivated}
                              endpoint={activateEndpoint}
                              label={activateButtonLabel}
                            />
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
