"use client";

import { useSession } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  firstFieldError,
  messageForApiFailure,
  readApiJson,
} from "@/lib/parse-api-response";

type Props = {
  email: string;
};

export function OnboardingRegisterForm({ email }: Props) {
  const router = useRouter();
  const { session } = useSession();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccess(false);
    try {
      let res: Response;
      try {
        res = await fetch("/api/user/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            phone: phone.trim(),
          }),
        });
      } catch {
        setErrorMessage(
          "Échec de l’inscription : impossible de contacter le serveur. Vérifiez votre connexion.",
        );
        return;
      }

      const { ok, status, body } = await readApiJson(res);

      if (ok) {
        setSuccess(true);
        const role = body && "role" in body ? (body as { role?: string | null }).role : null;
        window.setTimeout(async () => {
          if (role === "ADMIN") {
            await session?.reload();
            router.push("/admin");
            return;
          }
          router.refresh();
        }, 900);
        return;
      }

      setErrorMessage(
        firstFieldError(body) ??
          body?.error ??
          messageForApiFailure(status),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Créer votre fiche</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Votre compte est connecté, mais il n&apos;existe pas encore dans l&apos;application. Renseignez vos
        coordonnées pour enregistrer votre profil.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
        {success ? (
          <p
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-100"
          >
            Inscription réussie : votre fiche a été enregistrée. Chargement de la suite…
          </p>
        ) : null}
        {errorMessage ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-950 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-100"
          >
            {errorMessage}
          </p>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="reg-email">E-mail</Label>
          <Input
            id="reg-email"
            type="email"
            value={email}
            readOnly
            disabled
            className="bg-muted/50"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reg-first">Prénom</Label>
            <Input
              id="reg-first"
              name="firstName"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-last">Nom</Label>
            <Input
              id="reg-last"
              name="lastName"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              maxLength={120}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-phone">Téléphone</Label>
          <Input
            id="reg-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            maxLength={40}
          />
        </div>
        <Button
          type="submit"
          disabled={
            success || loading || !firstName.trim() || !lastName.trim() || !phone.trim()
          }
        >
          {loading ? "Enregistrement…" : success ? "Inscription réussie" : "S'inscrire"}
        </Button>
      </form>
    </section>
  );
}
