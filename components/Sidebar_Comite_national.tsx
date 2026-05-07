"use client";

import {
  Home,
  UserPlus,
  Store,
  MessageSquare,
  FileText,
  Coins,
  UserCheck,
  UserX,
  Landmark,
  MapPinned,
  BookOpen,
  UsersRound,
  Layers,
  Users,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";

/**
 * Sidebar — Comité National.
 * Palette: blue / yellow / red (matching brand). Three-tone, never mixed per item.
 */
type Category = "main" | "operations" | "communication";

type NavItem = {
  id: number;
  icon: typeof Home;
  label: string;
  href: string;
  category: Category;
  tone: "blue" | "yellow" | "red";
};

const navItems: readonly NavItem[] = [
  { id: 0, icon: Landmark, label: "Accueil", href: "/comite_national", category: "main", tone: "blue" },
  { id: 1, icon: Home, label: "Invitations", href: "/comite_national/invitations", category: "main", tone: "yellow" },
  { id: 2, icon: UserPlus, label: "A-Actives", href: "/comite_national/a-actives", category: "main", tone: "blue" },

  { id: 3, icon: Store, label: "Boutiques", href: "/comite_national/boutiques", category: "operations", tone: "yellow" },
  { id: 4, icon: FileText, label: "Abonnements", href: "/comite_national/abonnements", category: "operations", tone: "blue" },
  { id: 5, icon: Coins, label: "Zaïmu", href: "/comite_national/zaimu", category: "operations", tone: "yellow" },
  { id: 6, icon: UserCheck, label: "Utilisateurs actifs", href: "/comite_national/utilisateurs-actifs", category: "operations", tone: "red" },
  { id: 7, icon: UserX, label: "Utilisateurs passifs", href: "/comite_national/utilisateurs-passifs", category: "operations", tone: "red" },
  { id: 8, icon: MapPinned, label: "Centres", href: "/comite_national/centres", category: "operations", tone: "blue" },
  { id: 9, icon: BookOpen, label: "Chapitres", href: "/comite_national/chapitres", category: "operations", tone: "yellow" },
  { id: 10, icon: UsersRound, label: "Groupes", href: "/comite_national/groupes", category: "operations", tone: "red" },
  { id: 11, icon: Layers, label: "Sous-groupes", href: "/comite_national/sous-groupes", category: "operations", tone: "blue" },
  { id: 12, icon: Users, label: "Membres", href: "/comite_national/membres", category: "operations", tone: "yellow" },
  { id: 13, icon: LayoutGrid, label: "Départements", href: "/comite_national/departements", category: "operations", tone: "red" },

  { id: 14, icon: MessageSquare, label: "Messages", href: "/comite_national/messages", category: "communication", tone: "blue" },
] as const;

const categoryLabels: Record<Category, string> = {
  main: "Principal",
  operations: "Opérations",
  communication: "Communication",
};

const categoryDot: Record<Category, string> = {
  main: "bg-blue-600",
  operations: "bg-yellow-500",
  communication: "bg-red-600",
};

const toneIdle: Record<NavItem["tone"], string> = {
  blue: "text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300",
  yellow: "text-yellow-600 dark:text-yellow-400 group-hover:text-yellow-700 dark:group-hover:text-yellow-300",
  red: "text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300",
};

function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  // Root section path must not match all child routes — only exact match counts.
  if (href === "/comite_national") return false;
  return pathname.startsWith(`${href}/`);
}

const SidebarComiteNational = ({ isOpen }: { isOpen: boolean }) => {
  const pathname = usePathname();

  const groupedItems = navItems.reduce<Record<Category, NavItem[]>>(
    (acc, item) => {
      (acc[item.category] ??= []).push(item);
      return acc;
    },
    { main: [], operations: [], communication: [] }
  );

  return (
    <aside className="flex h-full w-full flex-col border-r border-blue-200/80 bg-white shadow-md shadow-blue-900/5 backdrop-blur-md dark:border-blue-900/50 dark:bg-zinc-950 dark:shadow-black/40">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-linear-to-br from-blue-50/95 via-white to-yellow-50/70 dark:from-zinc-950 dark:via-blue-950/30 dark:to-black">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_-20%,rgba(37,99,235,0.18),transparent),radial-gradient(ellipse_55%_40%_at_100%_0%,rgba(234,179,8,0.14),transparent),radial-gradient(ellipse_50%_35%_at_50%_100%,rgba(220,38,38,0.1),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_0%_-20%,rgba(37,99,235,0.28),transparent),radial-gradient(ellipse_55%_40%_at_100%_0%,rgba(234,179,8,0.12),transparent),radial-gradient(ellipse_50%_35%_at_50%_100%,rgba(220,38,38,0.15),transparent)]"
          aria-hidden
        />

        <div className="relative flex min-h-0 flex-1 flex-col">
          {/* Header */}
          <div className="shrink-0 border-b border-blue-200/70 bg-white/90 px-3 py-4 backdrop-blur-md dark:border-blue-900/40 dark:bg-zinc-950/80">
            <div
              className={clsx(
                "flex items-center gap-3 transition-[justify-content] duration-200",
                isOpen ? "justify-start" : "justify-center"
              )}
            >
              <div
                className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg shadow-blue-600/35 ring-2 ring-white dark:ring-blue-400/30"
                aria-hidden
              >
                <Landmark className="size-4.5" />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-yellow-400 px-1 text-[9px] font-bold leading-none text-blue-900 shadow-sm ring-1 ring-white dark:ring-zinc-950">
                  CN
                </span>
              </div>
              {isOpen && (
                <div className="min-w-0">
                  <p className="truncate bg-linear-to-r from-blue-800 via-blue-700 to-blue-600 bg-clip-text text-sm font-bold tracking-tight text-transparent dark:from-white dark:via-blue-200 dark:to-yellow-300">
                    Comité National
                  </p>
                  <p className="truncate text-xs font-medium text-blue-800/90 dark:text-blue-300/90">
                    Soka Hub
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav
            className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-2 py-4"
            aria-label="Navigation Comité National"
          >
            {(Object.keys(categoryLabels) as Category[]).map((category) => {
              const items = groupedItems[category];
              if (!items?.length) return null;

              return (
                <div key={category} className="space-y-1">
                  {isOpen ? (
                    <div className="mx-1 mb-1 flex items-center gap-2">
                      <span className={clsx("size-1.5 rounded-full", categoryDot[category])} aria-hidden />
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                        {categoryLabels[category]}
                      </p>
                      <span className="ml-1 h-px flex-1 bg-linear-to-r from-zinc-300/70 to-transparent dark:from-zinc-700/70" />
                    </div>
                  ) : (
                    <div className="my-2 flex items-center justify-center" aria-hidden>
                      <span className={clsx("size-1.5 rounded-full opacity-70", categoryDot[category])} />
                    </div>
                  )}

                  <ul className="space-y-0.5">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const isActive = isNavActive(pathname, item.href);

                      return (
                        <li key={item.href} className="relative">
                          {/* Active indicator bar */}
                          <span
                            aria-hidden
                            className={clsx(
                              "pointer-events-none absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-linear-to-b from-blue-500 via-blue-600 to-blue-700 transition-opacity duration-200",
                              isActive ? "opacity-100" : "opacity-0"
                            )}
                          />

                          <Link
                            href={item.href}
                            prefetch={false}
                            aria-current={isActive ? "page" : undefined}
                            title={!isOpen ? item.label : undefined}
                            className={clsx(
                              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-all duration-200",
                              "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950",
                              isOpen ? "justify-start" : "justify-center px-2",
                              isActive
                                ? "bg-linear-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-md shadow-blue-700/30 ring-1 ring-blue-500/30 dark:ring-blue-300/20"
                                : "text-zinc-800 hover:translate-x-0.5 hover:bg-white hover:shadow-sm dark:text-zinc-100 dark:hover:bg-white/10"
                            )}
                          >
                            <span
                              className={clsx(
                                "relative flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                                isActive
                                  ? "bg-white/15 ring-1 ring-white/25"
                                  : "bg-transparent group-hover:bg-zinc-50 dark:group-hover:bg-white/5"
                              )}
                            >
                              <Icon
                                className={clsx(
                                  "size-4.5 transition-colors",
                                  isActive ? "text-white" : toneIdle[item.tone]
                                )}
                                aria-hidden
                              />
                              {/* Collapsed-mode active dot indicator */}
                              {!isOpen && isActive && (
                                <span
                                  aria-hidden
                                  className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-yellow-400 ring-2 ring-white dark:ring-zinc-950"
                                />
                              )}
                            </span>

                            <span
                              className={clsx(
                                "truncate transition-[opacity,width] duration-200",
                                isOpen ? "opacity-100" : "sr-only w-0 opacity-0"
                              )}
                            >
                              {item.label}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="shrink-0 border-t border-blue-200/70 bg-white/85 px-3 py-3 backdrop-blur-md dark:border-blue-900/40 dark:bg-zinc-950/80">
            <p
              className={clsx(
                "text-center text-[11px] font-semibold tabular-nums",
                isOpen
                  ? "bg-linear-to-r from-blue-700 via-yellow-500 to-red-600 bg-clip-text text-transparent"
                  : "bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent tracking-tight dark:from-blue-400 dark:to-white"
              )}
            >
              {isOpen ? "Soka Hub · v1.0" : "v1"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarComiteNational;
