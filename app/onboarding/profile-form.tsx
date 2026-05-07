"use client";

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
import type { Role } from "@/app/generated/prisma";

function roleLabel(r: Role): string {
  return r.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

type Props = {
  email: string;
  activeRole: Role | null;
  pendingTargetRole: Role | null;
  initialFirstName: string | null;
  initialLastName: string | null;
  initialPhone: string | null;
};

export function OnboardingProfileForm({
  email,
  activeRole,
  pendingTargetRole,
  initialFirstName,
  initialLastName,
  initialPhone,
}: Props) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialFirstName ?? "");
  const [lastName, setLastName] = useState(initialLastName ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
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
        res = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            phone: phone.trim(),
          }),
        });
      } catch {
        setErrorMessage(
          "Échec de l’enregistrement : impossible de contacter le serveur. Vérifiez votre connexion.",
        );
        return;
      }

      const { ok, status, body } = await readApiJson(res);

      if (ok) {
        setSuccess(true);
        window.setTimeout(() => {
          router.refresh();
        }, 600);
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

  const roleFieldValue = activeRole
    ? roleLabel(activeRole)
    : pendingTargetRole
      ? `${roleLabel(pendingTargetRole)} (en attente de validation)`
      : "—";
  const roleFieldHint =
    !activeRole && !pendingTargetRole
      ? "Votre rôle sera attribué après la saisie d’un code d’invitation accepté."
      : activeRole
        ? "Rôle actif dans l’application."
        : "Ce rôle sera activé une fois les validateurs requis ayant approuvé votre demande.";

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Votre profil</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Complétez vos informations pour finaliser votre inscription dans l&apos;application.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
        {success ? (
          <p
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-100"
          >
            Enregistrement réussi : vos informations ont été mises à jour.
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
          <Label htmlFor="onb-email">E-mail</Label>
          <Input
            id="onb-email"
            type="email"
            value={email}
            readOnly
            disabled
            className="bg-muted/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="onb-role">Rôle</Label>
          <Input
            id="onb-role"
            value={roleFieldValue}
            readOnly
            disabled
            className="bg-muted/50"
            aria-describedby="onb-role-hint"
          />
          <p
            id="onb-role-hint"
            className="text-xs text-zinc-600 dark:text-zinc-400"
          >
            {roleFieldHint}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="onb-first">Prénom</Label>
            <Input
              id="onb-first"
              name="firstName"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="onb-last">Nom</Label>
            <Input
              id="onb-last"
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
          <Label htmlFor="onb-phone">Téléphone</Label>
          <Input
            id="onb-phone"
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
          {loading ? "Enregistrement…" : success ? "Enregistré" : "Enregistrer"}
        </Button>
      </form>
    </section>
  );
}
