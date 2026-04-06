import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getRequiredApproverRoles } from "@/lib/roles";
import { getMissingApproverRoles } from "@/lib/onboarding-logic";
import { OnboardingClient } from "./ui";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { approvalsReceived: true },
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-md p-8 text-center text-zinc-600">
        <p className="text-lg">Provisioning your account…</p>
        <p className="mt-2 text-sm">If this persists, ensure the Clerk webhook is configured.</p>
      </div>
    );
  }

  if (user.status === "ACTIVE" && user.role) {
    redirect("/dashboard");
  }

  const target = user.pendingTargetRole;
  const required = target ? getRequiredApproverRoles(target) : null;
  const missing =
    target && user.status === "PENDING_APPROVAL"
      ? getMissingApproverRoles(target, user.approvalsReceived)
      : null;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8 p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Onboarding
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          New accounts stay here until your invitation is accepted and two validators in the
          hierarchy approve you. Admins provisioned via bootstrap skip this step.
        </p>
      </header>
      <OnboardingClient
        status={user.status}
        pendingTargetRole={user.pendingTargetRole}
        requiredApproverRoles={required}
        missingApproverRoles={missing}
      />
    </div>
  );
}
