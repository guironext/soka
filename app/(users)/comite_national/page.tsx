import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Info,
  Landmark,
  Mail,
  MessageSquare,
  Sparkles,
  UserCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { getAppUserByClerkId } from "@/lib/app-user";
import { syncClerkAppMetadata } from "@/lib/clerk-sync";
import { dashboardPathForRole } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const quickLinks = [
  {
    href: "/comite_national/invitations",
    title: "Invitations",
    description: "Envoyer et suivre les invitations des membres.",
    icon: Mail,
    accent:
      "from-yellow-500 to-amber-600 shadow-yellow-600/25 border-yellow-300/80 dark:border-yellow-700/40",
    bar: "from-yellow-500 via-amber-400 to-blue-600",
    cardBorder: "border-yellow-200/80 dark:border-yellow-800/45",
  },
  {
    href: "/comite_national/a-actives",
    title: "À activer",
    description: "Comptes en attente d’activation ou de validation.",
    icon: UserPlus,
    accent:
      "from-blue-600 to-blue-800 shadow-blue-700/30 border-blue-200/80 dark:border-blue-800/50",
    bar: "from-blue-600 via-blue-500 to-red-500",
    cardBorder: "border-blue-200/80 dark:border-blue-800/50",
  },
  {
    href: "/comite_national/programme",
    title: "Programme",
    description: "Calendrier et événements du comité national.",
    icon: CalendarDays,
    accent:
      "from-red-600 to-red-800 shadow-red-700/30 border-red-200/90 dark:border-red-900/50",
    bar: "from-red-600 via-yellow-400 to-blue-700",
    cardBorder: "border-red-200/90 dark:border-red-900/45",
  },
  {
    href: "/comite_national/liste-des-membres",
    title: "Liste des membres",
    description: "Annuaire et statuts des membres rattachés.",
    icon: UserCheck,
    accent:
      "from-yellow-400 to-yellow-600 text-black shadow-yellow-600/25 border-yellow-300/80 dark:border-yellow-700/40",
    bar: "from-yellow-400 via-red-500 to-blue-700",
    cardBorder: "border-yellow-200/80 dark:border-yellow-800/45",
  },
  {
    href: "/comite_national/messages",
    title: "Messages",
    description: "Échanges et notifications internes.",
    icon: MessageSquare,
    accent:
      "from-blue-600 to-indigo-800 shadow-blue-700/30 border-blue-200/80 dark:border-blue-800/50",
    bar: "from-blue-600 via-indigo-500 to-yellow-400",
    cardBorder: "border-blue-200/80 dark:border-blue-800/50",
  },
  {
    href: "/comite_national/departements",
    title: "Départements",
    description: "Vue structurée par départements et territoires.",
    icon: UsersRound,
    accent:
      "from-red-600 to-rose-800 shadow-red-700/30 border-red-200/90 dark:border-red-900/50",
    bar: "from-red-600 via-rose-500 to-blue-600",
    cardBorder: "border-red-200/90 dark:border-red-900/45",
  },
] as const;

export default async function ComiteNationalPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await getAppUserByClerkId(userId);
  if (!user || !user.role) {
    redirect("/dashboard");
  }

  if (user.role !== "COMITE_NATIONAL") {
    redirect(dashboardPathForRole(user.role));
  }

  try {
    await syncClerkAppMetadata(user.clerkId, {
      status: user.status,
      role: user.role,
      pendingTargetRole: user.pendingTargetRole ?? null,
    });
  } catch {
    // Non-fatal: the page can still render; logs are emitted by Clerk SDK.
  }

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.email;

  return (
    <div className="relative min-h-full overflow-hidden bg-linear-to-br from-blue-50/90 via-white to-yellow-50/60 dark:from-zinc-950 dark:via-blue-950/25 dark:to-black">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_8%_0%,rgba(37,99,235,0.2),transparent),radial-gradient(ellipse_75%_45%_at_92%_15%,rgba(234,179,8,0.16),transparent),radial-gradient(ellipse_65%_40%_at_50%_100%,rgba(220,38,38,0.12),transparent)] dark:bg-[radial-gradient(ellipse_100%_55%_at_8%_0%,rgba(37,99,235,0.22),transparent),radial-gradient(ellipse_75%_45%_at_92%_15%,rgba(234,179,8,0.1),transparent),radial-gradient(ellipse_65%_40%_at_50%_100%,rgba(220,38,38,0.14),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
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
                  <Landmark
                    className="size-3.5 text-blue-700 dark:text-blue-300"
                    aria-hidden
                  />
                  Comité national
                </Badge>
                <span className="text-xs font-medium text-blue-900 dark:text-blue-200">
                  Espace de pilotage
                </span>
              </div>
              <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                <span className="bg-linear-to-r from-blue-800 via-blue-600 to-red-600 bg-clip-text text-transparent dark:from-white dark:via-blue-300 dark:to-yellow-300">
                  Bienvenue sur votre tableau de bord
                </span>
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-base">
                Accédez rapidement aux invitations, aux membres et aux modules
                opérationnels. Utilisez le menu latéral pour l’ensemble des
                rubriques.
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

        <div className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2 className="bg-linear-to-r from-blue-800 via-yellow-600 to-red-600 bg-clip-text text-sm font-bold text-transparent dark:from-blue-300 dark:via-yellow-300 dark:to-red-400">
              Accès rapides
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Raccourcis vers les actions les plus fréquentes
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map(
              ({
                href,
                title,
                description,
                icon: Icon,
                accent,
                bar,
                cardBorder,
              }) => (
                <Card
                  key={href}
                  className={`group relative overflow-hidden border-2 bg-white/95 shadow-md transition-shadow hover:shadow-lg dark:bg-zinc-950/90 ${cardBorder} shadow-zinc-900/5 hover:shadow-zinc-900/10 dark:shadow-black/40 dark:hover:shadow-black/55`}
                >
                  <div
                    className={`h-1.5 bg-linear-to-r ${bar}`}
                    aria-hidden
                  />
                  <CardHeader className="relative pb-2">
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl border bg-linear-to-br text-white shadow-md ${accent}`}
                    >
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <CardTitle className="pt-2 text-base leading-snug">
                      {title}
                    </CardTitle>
                    <CardDescription className="text-pretty">
                      {description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="border-t border-zinc-100 bg-zinc-50/60 pt-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-zinc-200 text-zinc-900 transition-colors group-hover:border-blue-300 group-hover:bg-blue-50/80 dark:border-zinc-700 dark:text-zinc-100 dark:group-hover:border-blue-700 dark:group-hover:bg-blue-950/40"
                      asChild
                    >
                      <Link href={href}>
                        Ouvrir
                        <ArrowRight
                          className="size-4 opacity-70 transition-transform group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ),
            )}
          </div>
        </div>

        <Card className="mt-8 overflow-hidden border-2 border-dashed border-blue-300/70 bg-linear-to-br from-blue-50/90 via-white to-yellow-50/70 shadow-md shadow-blue-900/8 dark:border-blue-700/45 dark:from-blue-950/30 dark:via-zinc-950 dark:to-yellow-950/20">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-blue-800 text-white shadow-md shadow-blue-700/30">
                <Info className="size-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">Besoin du détail ?</CardTitle>
                <CardDescription>
                  Informations, compte rendu, boutiques et autres modules sont
                  disponibles dans la barre latérale.
                </CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              asChild
              className="shrink-0 bg-linear-to-r from-blue-700 via-blue-600 to-blue-800 text-white shadow-md hover:from-blue-800 hover:to-blue-900"
            >
              <Link href="/comite_national/informations" className="gap-1.5">
                <Sparkles className="size-4" aria-hidden />
                Informations
              </Link>
            </Button>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
