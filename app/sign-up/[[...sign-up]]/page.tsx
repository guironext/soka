import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <SignUp
        forceRedirectUrl="/onboarding"
        signInUrl="/sign-in"
        appearance={{
          elements: { rootBox: "mx-auto" },
        }}
      />
    </div>
  );
}
