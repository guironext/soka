import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <SignIn
        forceRedirectUrl="/onboarding"
        signUpUrl="/sign-up"
        appearance={{
          elements: { rootBox: "mx-auto" },
        }}
      />
    </div>
  );
}
