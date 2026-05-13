"use client";

import {
	Home,
	UserPlus,
	Warehouse,
	MessageSquare,
	FileText,
	CalendarDays,
	Shield,
	UsersRound,
	Users,
	LayoutGrid,
	User,
	BookOpen,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";

/** Icon tints: only blue, yellow, red (+ hover variants). */
const navItems = [
	{
		id: 0,
		icon: Shield,
		label: "Accueil",
		href: "/admin",
		category: "main",
		accent:
			"text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300",
	},
	{
		id: 1,
		icon: Home,
		label: "Invitations",
		href: "/admin/invitations",
		category: "main",
		accent:
			"text-yellow-600 dark:text-yellow-400 group-hover:text-yellow-700 dark:group-hover:text-yellow-300",
	},
	{
		id: 2,
		icon: UserPlus,
		label: "A-Activer",
		href: "/admin/a-actives",
		category: "main",
		accent:
			"text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300",
	},
	{
		id: 3,
		icon: UserPlus,
		label: "Liste des utilisateurs",
		href: "/admin/liste-des-utilisateurs",
		category: "operations",
		accent:
			"text-yellow-600 dark:text-yellow-400 group-hover:text-yellow-700 dark:group-hover:text-yellow-300",
	},
	{
		id: 4,
		icon: Warehouse,
		label: "Boutiques",
		href: "/admin/boutiques",
		category: "operations",
		accent:
			"text-yellow-600 dark:text-yellow-400 group-hover:text-yellow-700 dark:group-hover:text-yellow-300",
	},
	{
		id: 5,
		icon: FileText,
		label: "Abonnements",
		href: "/admin/abonnements",
		category: "operations",
		accent:
			"text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300",
	},
	{
		id: 6,
		icon: CalendarDays,
		label: "Zaïmu",
		href: "/admin/zaimu",
		category: "operations",
		accent:
			"text-yellow-500 dark:text-yellow-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-300",
	},

	{
		id: 11,
		icon: UsersRound,
		label: "Structure SGI",
		href: "/admin/structure-sgi",
		category: "operations",
		accent:
			"text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300",
	},
	
	{
		id: 13,
		icon: Users,
		label: "Membres",
		href: "/admin/membres",
		category: "operations",
		accent:
			"text-yellow-600 dark:text-yellow-400 group-hover:text-yellow-700 dark:group-hover:text-yellow-300",
	},
	{
		id: 14,
		icon: LayoutGrid,
		label: "Départements",
		href: "/admin/departements",
		category: "operations",
		accent:
			"text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300",
	},
	{
		id: 15,
		icon: MessageSquare,
		label: "Messages",
		href: "/admin/messages",
		category: "communication",
		accent:
			"text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300",
	},
	{
		id: 17,
		icon: User,
		label: "Profile",
		href: "/admin/profile",
		category: "main",
		accent:
			"text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300",
	},
	{
		id: 18,
		icon: BookOpen,
		label: "Programme",
		href: "/admin/programme",
		category: "main",
		accent:
			"text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300",
	},
	{
		id: 16,
		icon: MessageSquare,
		label: "Informations",
		href: "/admin/informations",
		category: "main",
		accent:
			"text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300",
	},
	
	
	{
		id: 19,
		icon: FileText,
		label: "Compte rendu",
		href: "/admin/compte-rendu",
		category: "main",
		accent:
			"text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300",
	},
] as const;

const categoryLabels = {
	main: "Principal",
	operations: "Opérations",
	communication: "Communication",
} as const;

const categoryHeaderClass: Record<keyof typeof categoryLabels, string> = {
	main: "text-blue-900 dark:text-blue-200 border-l-2 border-blue-600 pl-2.5",
	operations:
		"text-yellow-900 dark:text-yellow-200 border-l-2 border-yellow-500 pl-2.5",
	communication:
		"text-red-900 dark:text-red-200 border-l-2 border-red-600 pl-2.5",
};

function isNavActive(pathname: string, href: string) {
	if (pathname === href) return true;
	if (href === "/rh") return false;
	// `/admin` must not match child routes (`/admin/invitations` starts with `/admin/`)
	if (href === "/admin") return false;
	return pathname.startsWith(`${href}/`);
}

const SidebarAdmin = ({ isOpen }: { isOpen: boolean }) => {
	const pathname = usePathname();

	const groupedItems = navItems.reduce(
		(acc, item) => {
			if (!acc[item.category]) acc[item.category] = [];
			acc[item.category]!.push(item);
			return acc;
		},
		{} as Record<string, (typeof navItems)[number][]>,
	);

	return (
		<aside className="flex h-full w-full flex-col border-r border-blue-200/80 bg-white shadow-md shadow-blue-900/5 backdrop-blur-md dark:border-blue-900/50 dark:bg-zinc-950 dark:shadow-black/40">
			<div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-linear-to-br from-blue-50/95 via-white to-yellow-50/70 dark:from-zinc-950 dark:via-blue-950/30 dark:to-black">
				<div
					className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_-20%,rgba(37,99,235,0.18),transparent),radial-gradient(ellipse_55%_40%_at_100%_0%,rgba(234,179,8,0.14),transparent),radial-gradient(ellipse_50%_35%_at_50%_100%,rgba(220,38,38,0.1),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_0%_-20%,rgba(37,99,235,0.28),transparent),radial-gradient(ellipse_55%_40%_at_100%_0%,rgba(234,179,8,0.12),transparent),radial-gradient(ellipse_50%_35%_at_50%_100%,rgba(220,38,38,0.15),transparent)]"
					aria-hidden
				/>
				<div className="relative flex min-h-0 flex-1 flex-col">
					<div className="shrink-0 border-b border-blue-200/70 bg-white/90 px-3 py-4 backdrop-blur-md dark:border-blue-900/40 dark:bg-zinc-950/80">
						<div
							className={clsx(
								"flex items-center gap-3 transition-[justify-content] duration-200",
								isOpen ? "justify-start" : "justify-center",
							)}>
							<div
								className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg shadow-blue-600/35 ring-2 ring-white dark:ring-blue-400/30"
								aria-hidden>
								<Warehouse className="size-4.5" />
							</div>
							{isOpen && (
								<div className="min-w-0">
									<p className="truncate bg-linear-to-r from-blue-800 via-blue-700 to-blue-600 bg-clip-text text-sm font-bold tracking-tight text-transparent dark:from-white dark:via-blue-200 dark:to-yellow-300">
										Aministrateur
									</p>
									<p className="truncate text-xs font-medium text-blue-800/90 dark:text-blue-300/90">
										Soka Hub
									</p>
								</div>
							)}
						</div>
					</div>

					<nav
						className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-2 py-4"
						aria-label="Navigation DRH">
						{(
							Object.entries(groupedItems) as [
								keyof typeof categoryLabels,
								(typeof navItems)[number][],
							][]
						).map(([category, items]) => (
							<div key={category} className="space-y-1">
								{isOpen && (
									<p
										className={clsx(
											"mx-1 mb-0.5 rounded-md py-1 text-[11px] font-bold uppercase tracking-wider",
											categoryHeaderClass[category],
										)}>
										{categoryLabels[category]}
									</p>
								)}
								<ul className="space-y-0.5">
									{items.map((item) => {
										const Icon = item.icon;
										const isActive = isNavActive(pathname, item.href);

										return (
											<li key={item.href}>
												<Link
													href={item.href}
													title={!isOpen ? item.label : undefined}
													className={clsx(
														"group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-all duration-200",
														"focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950",
														isOpen ? "justify-start" : "justify-center px-2",
														isActive
															? "bg-linear-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-md shadow-blue-700/30"
															: "text-zinc-800 hover:bg-white hover:shadow-sm dark:text-zinc-100 dark:hover:bg-white/10",
													)}>
													<Icon
														className={clsx(
															"size-4.5 shrink-0 transition-colors",
															isActive ? "text-white" : item.accent,
														)}
														aria-hidden
													/>
													<span
														className={clsx(
															"truncate transition-[opacity,width] duration-200",
															isOpen ? "opacity-100" : "sr-only w-0 opacity-0",
														)}>
														{item.label}
													</span>
												</Link>
											</li>
										);
									})}
								</ul>
							</div>
						))}
					</nav>

					<div className="shrink-0 border-t border-blue-200/70 bg-white/85 px-3 py-3 backdrop-blur-md dark:border-blue-900/40 dark:bg-zinc-950/80">
						<p
							className={clsx(
								"text-center text-[11px] font-semibold tabular-nums",
								isOpen
									? "bg-linear-to-r from-blue-700 via-yellow-500 to-red-600 bg-clip-text text-transparent"
									: "bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent tracking-tight dark:from-blue-400 dark:to-white",
							)}>
							{isOpen ? "Soka Hub · v1.0" : "v1"}
						</p>
					</div>
				</div>
			</div>
		</aside>
	);
};

export default SidebarAdmin;
