"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { Role } from "@/app/generated/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  KeyRound,
  Link2,
  Mail,
  Send,
  Sparkles,
  UserPlus,
} from "lucide-react";

function roleLabel(r: Role): string {
  return r
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function displayLabelFor(
  options: { value: Role; label: string }[],
  r: Role,
): string {
  return options.find((o) => o.value === r)?.label ?? roleLabel(r);
}

type Props = {
  roleOptions: { value: Role; label: string }[];
};

type CreateResponse = {
  code: string;
  targetRole: Role;
  responsabilite: string;
  inviteUrl: string;
  expiresAt: string;
  maxUses: number;
};

function withRecipientEmail(baseUrl: string, email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return baseUrl;
  try {
    const u = new URL(baseUrl);
    u.searchParams.set("email", trimmed);
    return u.toString();
  } catch {
    return baseUrl;
  }
}

function buildMailto(
  recipient: string,
  roleDisplayLabel: string,
  responsabilite: string,
  inviteUrl: string,
  code: string,
): string {
  const r = roleDisplayLabel;
  const resp = responsabilite.trim();
  const subject = `Invitation Soka Hub — ${r}`;
  const body = `Bonjour,

Vous êtes invité·e à rejoindre le hub avec le rôle : ${r}.
${resp ? `\nResponsabilité : ${resp}\n` : ""}
Ouvrez ce lien après vous être connecté·e ou inscrit·e sur la plateforme :
${inviteUrl}

Si le lien ne fonctionne pas, copiez ce code sur la page d'intégration :
${code}

Cordialement`;
  const q = new URLSearchParams({
    subject,
    body,
  });
  return `mailto:${encodeURIComponent(recipient.trim())}?${q.toString()}`;
}

function emailsMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function AdminInvitationForm({ roleOptions }: Props) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientEmailConfirm, setRecipientEmailConfirm] = useState("");
  const [doubleCheckConfirmed, setDoubleCheckConfirmed] = useState(false);
  const [responsabilite, setResponsabilite] = useState("");
  const [targetRole, setTargetRole] = useState<Role | "">(roleOptions[0]?.value ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateResponse | null>(null);
  /** E-mail saisi au moment du succès — conservé pour le lien / mailto après vidage du formulaire */
  const [pinnedRecipientEmail, setPinnedRecipientEmail] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  const displayUrl = useMemo(() => {
    if (!result?.inviteUrl) return "";
    const emailForLink =
      pinnedRecipientEmail !== null ? pinnedRecipientEmail : recipientEmail;
    return withRecipientEmail(result.inviteUrl, emailForLink);
  }, [result, recipientEmail, pinnedRecipientEmail]);

  const emailProvided = recipientEmail.trim().length > 0;
  const emailConfirmationOk = !emailProvided || emailsMatch(recipientEmail, recipientEmailConfirm);
  const formReadyForSubmit =
    Boolean(targetRole) &&
    responsabilite.trim().length > 0 &&
    doubleCheckConfirmed &&
    emailConfirmationOk;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!targetRole) return;
    if (!doubleCheckConfirmed) {
      setBanner({
        type: "err",
        text: "Cochez la case de confirmation après avoir relu le rôle, la responsabilité et l'e-mail.",
      });
      return;
    }
    if (emailProvided && !emailsMatch(recipientEmail, recipientEmailConfirm)) {
      setBanner({
        type: "err",
        text: "Les deux saisies d'e-mail ne correspondent pas — vérifiez l'adresse du destinataire.",
      });
      return;
    }
    setLoading(true);
    setResult(null);
    setPinnedRecipientEmail(null);
    setBanner(null);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          responsabilite: responsabilite.trim(),
          expiresInDays: 30,
          maxUses: 1,
        }),
      });
      const data = (await res.json()) as CreateResponse & { error?: string };
      if (!res.ok) {
        setBanner({
          type: "err",
          text: data.error ?? "Impossible de créer l'invitation",
        });
        return;
      }
      setPinnedRecipientEmail(recipientEmail.trim());
      setResult(data);
      setBanner({ type: "ok", text: "Lien d'invitation créé." });
      setRecipientEmail("");
      setRecipientEmailConfirm("");
      setDoubleCheckConfirmed(false);
      setResponsabilite("");
      setTargetRole(roleOptions[0]?.value ?? "");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setBanner({ type: "ok", text: `${label} copié dans le presse-papiers.` });
    } catch {
      setBanner({
        type: "err",
        text: "Copie impossible — sélectionnez le texte manuellement.",
      });
    }
  }

  const pageShell = (children: ReactNode, mainExtra?: ReactNode) => (
    <div className="relative min-h-full overflow-hidden bg-linear-to-br from-blue-50/90 via-white to-yellow-50/60 dark:from-zinc-950 dark:via-blue-950/25 dark:to-black">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_8%_0%,rgba(37,99,235,0.2),transparent),radial-gradient(ellipse_75%_45%_at_92%_15%,rgba(234,179,8,0.16),transparent),radial-gradient(ellipse_65%_40%_at_50%_100%,rgba(220,38,38,0.12),transparent)] dark:bg-[radial-gradient(ellipse_100%_55%_at_8%_0%,rgba(37,99,235,0.22),transparent),radial-gradient(ellipse_75%_45%_at_92%_15%,rgba(234,179,8,0.1),transparent),radial-gradient(ellipse_65%_40%_at_50%_100%,rgba(220,38,38,0.14),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-200/80 bg-white/95 px-6 py-7 shadow-lg shadow-blue-900/10 ring-1 ring-blue-500/10 backdrop-blur-sm dark:border-blue-800/60 dark:bg-zinc-950/90 dark:shadow-black/50 sm:px-8 sm:py-8">
          <div
            className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-600/12"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-12 size-48 rounded-full bg-yellow-300/20 blur-2xl dark:bg-yellow-500/10"
            aria-hidden
          />
          <div className="relative space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1.5 border-blue-400/70 bg-linear-to-r from-blue-100 to-yellow-100 text-blue-950 shadow-sm dark:border-blue-500/50 dark:from-blue-950/80 dark:to-yellow-950/40 dark:text-yellow-100"
              >
                <Mail className="size-3.5 text-blue-600 dark:text-blue-300" aria-hidden />
                Invitations
              </Badge>
              <span className="text-xs font-medium text-blue-900/90 dark:text-blue-200/90">
                Lien sécurisé et code de secours
              </span>
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="bg-linear-to-r from-blue-800 via-blue-600 to-red-600 bg-clip-text text-transparent dark:from-white dark:via-blue-300 dark:to-yellow-300">
                Inviter un membre
              </span>
            </h1>
            
          </div>
        </div>

        {mainExtra}

        <div className="mt-8 space-y-8">{children}</div>
      </div>
    </div>
  );

  if (roleOptions.length === 0) {
    return pageShell(
      <Card className="relative overflow-hidden border-2 border-amber-200/90 bg-amber-50/90 shadow-md shadow-amber-900/10 ring-1 ring-amber-500/15 dark:border-amber-800/50 dark:bg-amber-950/35 dark:shadow-black/40">
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-amber-400/25 blur-2xl dark:bg-amber-600/15"
          aria-hidden
        />
        <CardHeader className="relative">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-300/80 bg-white/90 text-amber-800 shadow-sm dark:border-amber-700/50 dark:bg-amber-950/50 dark:text-amber-200">
              <AlertCircle className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-lg text-amber-950 dark:text-amber-100">
                Aucun rôle invitable
              </CardTitle>
              <CardDescription className="text-amber-900/95 dark:text-amber-200/85">
                Votre compte ne permet pas d&apos;émettre d&apos;invitations depuis cette interface.
                Contactez un administrateur si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>,
    );
  }

  return pageShell(
    <>
      <Card className="relative overflow-hidden border-2 border-blue-200/80 bg-white/90 shadow-md shadow-blue-900/8 ring-1 ring-blue-500/10 dark:border-blue-800/50 dark:bg-zinc-950/80">
        <div
          className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-blue-400/20 dark:bg-blue-600/18"
          aria-hidden
        />
        <CardHeader className="relative border-b border-blue-100/80 pb-4 dark:border-blue-900/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-blue-200/90 bg-linear-to-br from-blue-50 to-white text-blue-700 shadow-sm dark:border-blue-700/50 dark:from-blue-950/60 dark:to-zinc-900 dark:text-blue-200">
                <UserPlus className="size-5" aria-hidden />
              </span>
              <div>
                <CardTitle className="text-lg sm:text-xl">Nouvelle invitation</CardTitle>
                <CardDescription className="mt-1 max-w-xl">
                  Le rôle est attribué après acceptation du code et validation selon la chaîne
                  habituelle.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {banner ? (
            <div
              role={banner.type === "err" ? "alert" : "status"}
              className={cn(
                "mb-6 flex gap-3 rounded-xl border px-3.5 py-3 text-sm",
                banner.type === "err"
                  ? "border-red-200/90 bg-red-50 text-red-950 dark:border-red-900/55 dark:bg-red-950/40 dark:text-red-100"
                  : "border-emerald-200/90 bg-emerald-50 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-100",
              )}
            >
              {banner.type === "err" ? (
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              ) : (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              )}
              <span className="leading-snug">{banner.text}</span>
            </div>
          ) : null}
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="inv-email" className="text-foreground">
                E-mail du destinataire
              </Label>
              <Input
                id="inv-email"
                type="email"
                autoComplete="email"
                placeholder="prenom.nom@exemple.org"
                value={recipientEmail}
                onChange={(e) => {
                  const v = e.target.value;
                  setRecipientEmail(v);
                  if (!v.trim()) setRecipientEmailConfirm("");
                }}
                className="h-10 bg-background/80"
              />
              <p className="text-xs text-muted-foreground">
                Optionnel pour créer le lien ; personnalise le lien et le message dans votre
                messagerie.
              </p>
            </div>
            {emailProvided ? (
              <div className="space-y-2">
                <Label htmlFor="inv-email-confirm" className="text-foreground">
                  Confirmer l&apos;e-mail du destinataire
                </Label>
                <Input
                  id="inv-email-confirm"
                  type="email"
                  autoComplete="email"
                  placeholder="Saisir la même adresse une seconde fois"
                  value={recipientEmailConfirm}
                  onChange={(e) => setRecipientEmailConfirm(e.target.value)}
                  aria-invalid={emailProvided && !emailConfirmationOk}
                  className="h-10 bg-background/80"
                />
                {emailProvided && !emailConfirmationOk ? (
                  <p className="text-xs text-destructive" role="alert">
                    Les deux e-mails doivent être identiques.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Double vérification pour éviter une faute de frappe sur l&apos;adresse.
                  </p>
                )}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="inv-responsabilite" className="text-foreground">
                Responsabilité
              </Label>
              <textarea
                id="inv-responsabilite"
                required
                maxLength={500}
                rows={3}
                placeholder="Ex. Trésorerie, suivi des adhérents, communication…"
                value={responsabilite}
                onChange={(e) => setResponsabilite(e.target.value)}
                className={cn(
                  "min-h-20 w-full min-w-0 resize-y rounded-lg border border-input bg-background/80 px-3 py-2.5 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
                )}
              />
              <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
                <span>Obligatoire — mission ou poste couvert (max. 500 caractères).</span>
                <span className="tabular-nums">{responsabilite.length}/500</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Rôle invité</Label>
              <Select
                value={targetRole || undefined}
                onValueChange={(v) => setTargetRole(v as Role)}
              >
                <SelectTrigger className="h-10 w-full bg-background/80">
                  <SelectValue placeholder="Choisir un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 rounded-xl border border-blue-200/70 bg-blue-50/40 px-3 py-3 dark:border-blue-900/45 dark:bg-blue-950/25">
              <Checkbox
                id="inv-double-check"
                checked={doubleCheckConfirmed}
                onCheckedChange={(v) => setDoubleCheckConfirmed(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="inv-double-check" className="cursor-pointer text-sm font-normal leading-snug text-foreground">
                J&apos;ai relu et je confirme le rôle invité, la responsabilité et l&apos;adresse
                e-mail (si renseignée) avant de créer le lien.
              </Label>
            </div>
            <div className="pt-1">
              <Button
                type="submit"
                size="lg"
                className="w-full gap-2 sm:w-auto"
                disabled={loading || !formReadyForSubmit}
              >
                <Sparkles className="size-4 opacity-90" aria-hidden />
                {loading ? "Création…" : "Créer le lien d'invitation"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {result ? (
        <Card className="relative overflow-hidden border-2 border-emerald-200/85 bg-linear-to-br from-emerald-50/90 via-white to-emerald-50/50 shadow-lg shadow-emerald-900/10 ring-1 ring-emerald-500/15 dark:border-emerald-800/45 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-emerald-950/25 dark:shadow-black/40">
          <div
            className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-600/15"
            aria-hidden
          />
          <CardHeader className="relative border-b border-emerald-200/70 pb-4 dark:border-emerald-900/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-emerald-300/80 bg-white/90 text-emerald-700 shadow-sm dark:border-emerald-700/50 dark:bg-emerald-950/60 dark:text-emerald-200">
                  <Send className="size-5" aria-hidden />
                </span>
                <div>
                  <CardTitle className="text-lg text-emerald-950 dark:text-emerald-100 sm:text-xl">
                    Lien prêt à envoyer
                  </CardTitle>
                  <CardDescription className="mt-2 space-y-1.5 text-foreground/90 dark:text-zinc-300">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Badge
                        variant="secondary"
                        className="font-normal text-foreground dark:text-zinc-100"
                      >
                        {displayLabelFor(roleOptions, result.targetRole)}
                      </Badge>
                      <span className="text-muted-foreground">
                        expire le{" "}
                        {new Date(result.expiresAt).toLocaleDateString("fr-FR", {
                          dateStyle: "long",
                        })}
                      </span>
                    </span>
                    <span className="block text-sm">
                      Responsabilité :{" "}
                      <strong className="font-medium text-foreground">{result.responsabilite}</strong>
                    </span>
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-6 pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-950 dark:text-emerald-100">
                <Link2 className="size-4 opacity-80" aria-hidden />
                Lien d&apos;invitation
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <Input
                  readOnly
                  value={displayUrl}
                  className="min-h-10 flex-1 font-mono text-xs leading-normal"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 gap-2 sm:h-auto"
                  onClick={() => copyText("Lien", displayUrl)}
                >
                  <Copy className="size-4" aria-hidden />
                  Copier
                </Button>
              </div>
            </div>
            <Separator className="bg-emerald-200/60 dark:bg-emerald-900/50" />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-950 dark:text-emerald-100">
                <KeyRound className="size-4 opacity-80" aria-hidden />
                Code de secours
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <Input readOnly value={result.code} className="min-h-10 flex-1 font-mono text-sm" />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 gap-2 border-emerald-200/80 bg-white/80 sm:h-auto dark:border-emerald-800/50 dark:bg-zinc-950/50"
                  onClick={() => copyText("Code", result.code)}
                >
                  <Copy className="size-4" aria-hidden />
                  Copier
                </Button>
              </div>
            </div>
            <div className="pt-1">
              {(pinnedRecipientEmail ?? "").trim() ? (
                <Button type="button" size="lg" className="gap-2" asChild>
                  <a
                    href={buildMailto(
                      (pinnedRecipientEmail ?? "").trim(),
                      displayLabelFor(roleOptions, result.targetRole),
                      result.responsabilite,
                      displayUrl,
                      result.code,
                    )}
                  >
                    <Mail className="size-4" aria-hidden />
                    Ouvrir le client mail
                  </a>
                </Button>
              ) : (
                <p className="rounded-lg border border-dashed border-emerald-300/70 bg-emerald-50/50 px-3 py-2.5 text-xs text-muted-foreground dark:border-emerald-800/50 dark:bg-emerald-950/20">
                  Aucun e-mail n&apos;avait été renseigné pour cette invitation : copiez le lien ou
                  créez une nouvelle invitation avec un e-mail pour ouvrir le client mail.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </>,
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      {[
        { step: "1", text: "Renseigner rôle et responsabilité", icon: UserPlus },
        { step: "2", text: "Créer le lien et le code", icon: Link2 },
        { step: "3", text: "Copier ou envoyer par e-mail", icon: Mail },
      ].map(({ step, text, icon: Icon }) => (
        <div
          key={step}
          className="flex items-center gap-3 rounded-xl border border-blue-200/70 bg-white/85 px-3 py-3 shadow-sm dark:border-blue-800/40 dark:bg-zinc-950/55"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-200">
            {step}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-900/80 dark:text-blue-300/90">
              <Icon className="size-3.5 opacity-80" aria-hidden />
              Étape {step}
            </div>
            <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">{text}</p>
          </div>
        </div>
      ))}
    </div>,
  );
}
