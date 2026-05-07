import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Shield,
  Sparkles,
  UserCog,
  UserCheck,
  Users,
} from "lucide-react";
import { getAppUserByClerkId } from "@/lib/app-user";
import { isAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { AccountStatus } from "@/app/generated/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await getAppUserByClerkId(userId);
  if (!user || !isAdmin(user.role)) {
    redirect("/");
  }

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.email;

  const [totalUsers, activeUsers, pendingUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: AccountStatus.ACTIVE } }),
    prisma.user.count({
      where: {
        status: {
          in: [
            AccountStatus.PENDING_INVITATION,
            AccountStatus.PENDING_APPROVAL,
          ],
        },
      },
    }),
  ]);

  const activePct =
    totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  return (
    <div className="relative min-h-full overflow-hidden bg-linear-to-br from-blue-50/90 via-white to-yellow-50/60 dark:from-zinc-950 dark:via-blue-950/25 dark:to-black">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_8%_0%,rgba(37,99,235,0.2),transparent),radial-gradient(ellipse_75%_45%_at_92%_15%,rgba(234,179,8,0.16),transparent),radial-gradient(ellipse_65%_40%_at_50%_100%,rgba(220,38,38,0.12),transparent)] dark:bg-[radial-gradient(ellipse_100%_55%_at_8%_0%,rgba(37,99,235,0.22),transparent),radial-gradient(ellipse_75%_45%_at_92%_15%,rgba(234,179,8,0.1),transparent),radial-gradient(ellipse_65%_40%_at_50%_100%,rgba(220,38,38,0.14),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-200/80 bg-white/95 px-6 py-8 shadow-lg shadow-blue-900/10 ring-1 ring-blue-500/10 backdrop-blur-sm dark:border-blue-800/60 dark:bg-zinc-950/90 dark:shadow-black/50 sm:px-8 sm:py-10">
          <div
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-600/15"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-16 size-56 rounded-full bg-yellow-300/25 blur-2xl dark:bg-yellow-500/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-1/3 top-1/2 size-40 -translate-y-1/2 rounded-full bg-red-400/15 blur-2xl dark:bg-red-600/12"
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="gap-1 border-blue-400/70 bg-linear-to-r from-blue-100 to-yellow-100 text-blue-950 shadow-sm dark:border-blue-500/50 dark:from-blue-950/80 dark:to-yellow-950/40 dark:text-yellow-100"
                >
                  <Sparkles className="size-3.5 text-yellow-600 dark:text-yellow-400" aria-hidden />
                  Espace administrateur
                </Badge>
                <span className="text-xs font-medium text-blue-900 dark:text-blue-200">
                  Accès réservé aux administrateurs
                </span>
              </div>
              <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                <span className="bg-linear-to-r from-blue-800 via-blue-600 to-red-600 bg-clip-text text-transparent dark:from-white dark:via-blue-300 dark:to-yellow-300">
                  Administration des utilisateurs
                </span>
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-base">
                Vue d&apos;ensemble des comptes, des statuts et des prochaines
                actions pour gérer les rôles et les accès au hub.
              </p>
            </div>
            <div className="shrink-0 rounded-xl border-2 border-yellow-400/50 bg-linear-to-br from-yellow-50 to-white px-4 py-3 text-sm shadow-md shadow-yellow-900/10 dark:border-yellow-600/40 dark:from-yellow-950/40 dark:to-zinc-900 dark:shadow-black/40">
              <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-300">
                Connecté en tant que
              </p>
              <p className="font-bold text-black dark:text-white">{displayName}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Card className="relative overflow-hidden border-2 border-blue-200/80 bg-white/90 shadow-md shadow-blue-900/8 ring-1 ring-blue-500/10 dark:border-blue-800/50 dark:bg-zinc-950/80">
            <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-blue-400/20 dark:bg-blue-600/20" aria-hidden />
            <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardDescription className="font-medium text-blue-900/80 dark:text-blue-300">
                  Utilisateurs enregistrés
                </CardDescription>
                <CardTitle className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-blue-900 dark:text-blue-100">
                  {totalUsers}
                </CardTitle>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-blue-800 text-white shadow-md shadow-blue-700/30">
                <Users className="size-5" aria-hidden />
              </div>
            </CardHeader>
            <CardContent className="relative pb-4 pt-0">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Tous les comptes présents en base
              </p>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden border-2 border-yellow-300/80 bg-white/90 shadow-md shadow-yellow-900/10 ring-1 ring-yellow-500/15 dark:border-yellow-700/40 dark:bg-zinc-950/80">
            <div
              className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-yellow-300/30 dark:bg-yellow-500/15"
              aria-hidden
            />
            <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardDescription className="font-medium text-yellow-900 dark:text-yellow-300">
                  Comptes actifs
                </CardDescription>
                <CardTitle className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-yellow-700 dark:text-yellow-400">
                  {activeUsers}
                </CardTitle>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-yellow-400 to-yellow-600 text-black shadow-md shadow-yellow-600/25">
                <UserCheck className="size-5" aria-hidden />
              </div>
            </CardHeader>
            <CardContent className="relative pb-4 pt-0">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Statut « actif » — peuvent utiliser l&apos;application
                {totalUsers > 0 && (
                  <span className="mt-1 block font-semibold tabular-nums text-black dark:text-white">
                    {activePct}% du total
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden border-2 border-red-200/90 bg-white/90 shadow-md shadow-red-900/10 ring-1 ring-red-500/10 dark:border-red-900/50 dark:bg-zinc-950/80">
            <div
              className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-red-400/15 dark:bg-red-600/15"
              aria-hidden
            />
            <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardDescription className="font-medium text-red-900 dark:text-red-300">
                  En attente
                </CardDescription>
                <CardTitle className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-red-700 dark:text-red-400">
                  {pendingUsers}
                </CardTitle>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-red-600 to-red-800 text-white shadow-md shadow-red-700/30">
                <Clock className="size-5" aria-hidden />
              </div>
            </CardHeader>
            <CardContent className="relative pb-4 pt-0">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Invitation ou validation en cours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-10">
          <h2 className="mb-4 bg-linear-to-r from-blue-800 via-yellow-600 to-red-600 bg-clip-text text-sm font-bold text-transparent dark:from-blue-300 dark:via-yellow-300 dark:to-red-400">
            Actions et modules
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="overflow-hidden border-2 border-blue-200/80 bg-white/95 shadow-md shadow-blue-900/10 transition-shadow hover:shadow-lg hover:shadow-blue-900/15 dark:border-blue-800/50 dark:bg-zinc-950/90">
              <div className="h-1.5 bg-linear-to-r from-blue-600 via-blue-500 to-yellow-400" aria-hidden />
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-blue-800 text-white shadow-md shadow-blue-700/35">
                  <Users className="size-5" aria-hidden />
                </div>
                <CardTitle className="pt-2">Gestion des utilisateurs</CardTitle>
                <CardDescription>
                  Consulter, filtrer et modifier les rôles lorsque la liste
                  détaillée sera branchée ici.
                </CardDescription>
              </CardHeader>
              <CardFooter className="border-t border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/30">
                <Button variant="outline" size="sm" className="gap-1.5 border-blue-300 text-blue-900 dark:border-blue-700 dark:text-blue-100" disabled>
                  Liste des utilisateurs
                  <ArrowRight className="size-4 opacity-60" aria-hidden />
                </Button>
                <span className="ml-auto text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                  Bientôt disponible
                </span>
              </CardFooter>
            </Card>

            <Card className="overflow-hidden border-2 border-red-200/80 bg-white/95 shadow-md shadow-red-900/10 transition-shadow hover:shadow-lg hover:shadow-red-900/15 dark:border-red-900/45 dark:bg-zinc-950/90">
              <div className="h-1.5 bg-linear-to-r from-red-600 via-yellow-400 to-blue-700" aria-hidden />
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-red-600 to-red-800 text-white shadow-md shadow-red-700/35">
                  <Shield className="size-5" aria-hidden />
                </div>
                <CardTitle className="pt-2">Rôles et accès</CardTitle>
                <CardDescription>
                  Politique d&apos;accès par rôle (comité, centres, groupes,
                  etc.) centralisée depuis l&apos;administration.
                </CardDescription>
              </CardHeader>
              <CardFooter className="border-t border-red-100 bg-red-50/40 dark:border-red-900/30 dark:bg-red-950/25">
                <Button variant="outline" size="sm" className="gap-1.5 border-red-300 text-red-900 dark:border-red-800 dark:text-red-100" disabled>
                  Configuration des rôles
                  <ArrowRight className="size-4 opacity-60" aria-hidden />
                </Button>
                <span className="ml-auto text-xs font-semibold text-blue-700 dark:text-blue-400">
                  Bientôt disponible
                </span>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Contexte RH — liens détaillés dans la barre latérale */}
        <Card className="mt-8 overflow-hidden border-2 border-dashed border-yellow-400/70 bg-linear-to-br from-yellow-50/90 via-white to-blue-50/80 shadow-md shadow-yellow-900/10 dark:border-yellow-600/40 dark:from-yellow-950/25 dark:via-zinc-950 dark:to-blue-950/30">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-yellow-400 to-yellow-600 text-black shadow-md shadow-yellow-600/30">
                <UserCog className="size-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">Module RH</CardTitle>
                <CardDescription>
                  Pointage, congés et courrier sont regroupés dans le menu
                  latéral (DRH). Utilisez le tableau de bord pour une vue
                  générale du hub.
                </CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              asChild
              className="shrink-0 bg-linear-to-r from-blue-700 via-blue-600 to-blue-800 text-white shadow-md hover:from-blue-800 hover:to-blue-900"
            >
              <Link href="/dashboard">Tableau de bord</Link>
            </Button>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
