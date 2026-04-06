import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ROLE_RULES } from "@/lib/roles";
import type { Role } from "@/app/generated/prisma";
import { DashboardClient } from "./ui";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.status !== "ACTIVE" || !user.role) {
    redirect("/onboarding");
  }

  const invitableTargets = ROLE_RULES.filter((r) =>
    r.allowedIssuerRoles.includes(user.role as Role),
  ).map((r) => r.targetRole);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Signed in as <span className="font-medium text-zinc-800 dark:text-zinc-200">{user.email}</span>{" "}
          · role <span className="font-mono text-sm">{user.role}</span>
        </p>
      </header>
      <DashboardClient invitableRoles={invitableTargets} />
    </div>
  );
}
