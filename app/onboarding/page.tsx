import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { redirectIfReadyForRoleHome } from "@/lib/auth-redirect";
import { getAppUserByClerkId } from "@/lib/app-user";
import { Suspense } from "react";
import { OnboardingProfileForm } from "./profile-form";
import { OnboardingRegisterForm } from "./register-form";
import { OnboardingClient } from "./ui";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  await redirectIfReadyForRoleHome(userId);

  const user = await getAppUserByClerkId(userId);
  if (!user) {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email =
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      "";

    return (
      <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          Vous êtes connecté, mais votre compte n&apos;a pas encore été synchronisé avec la base de
          données (par exemple si le webhook Clerk n&apos;est pas configuré en local). Utilisez le
          formulaire ci-dessous pour créer votre fiche utilisateur.
        </p>
        {!email ? (
          <p className="text-sm text-destructive">
            Aucun e-mail n&apos;est associé à votre compte Clerk : ajoutez-en un dans les paramètres du
            compte avant de vous inscrire.
          </p>
        ) : null}
        <OnboardingRegisterForm email={email} />
      </main>
    );
  }

  if (user.status === "PENDING_APPROVAL" && user.pendingTargetRole) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Intégration
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Étape 1 : vos coordonnées. Ensuite, suivez les instructions pour votre code d&apos;invitation
          ou la validation de votre rôle.
        </p>
      </div>
      <OnboardingProfileForm
        email={user.email}
        activeRole={user.role}
        pendingTargetRole={user.pendingTargetRole}
        initialFirstName={user.firstName}
        initialLastName={user.lastName}
        initialPhone={user.phone}
      />
      <Suspense fallback={null}>
        <OnboardingClient status={user.status} />
      </Suspense>
    </main>
  );
}

