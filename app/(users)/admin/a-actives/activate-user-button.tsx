"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  disabled?: boolean;
  className?: string;
  /**
   * Called after a successful POST to /api/admin/activate-user. The parent is
   * expected to drop this user from its local state so the row disappears
   * immediately, without waiting for a server-component refetch.
   */
  onActivated?: (userId: string) => void;
};

export function ActivateUserButton({
  userId,
  disabled,
  className,
  onActivated,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onActivate() {
    setPending(true);
    try {
      const res = await fetch("/api/admin/activate-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      /**
       * If middleware (proxy.ts) redirects the POST (e.g. to `/onboarding`),
       * fetch silently follows the redirect, lands on an HTML page, and we'd
       * otherwise treat that as success. Detect it explicitly and surface a
       * clear error so the bug is loud, not silent.
       */
      const contentType = res.headers.get("content-type") ?? "";
      if (res.redirected || !contentType.includes("application/json")) {
        const message = `L’API d’activation a été interceptée (redirigée vers ${new URL(res.url).pathname}). Vérifie la configuration du middleware.`;
        console.error("[activate-user] unexpected redirect", {
          redirected: res.redirected,
          finalUrl: res.url,
          contentType,
          status: res.status,
        });
        toast.error(message);
        window.alert(message);
        return;
      }

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        const message = data.error ?? `Échec de l’activation (${res.status})`;
        console.error("[activate-user]", res.status, data);
        toast.error(message);
        window.alert(message);
        return;
      }
      toast.success("Compte activé — rôle attribué et statut ACTIVE.");
      onActivated?.(userId);
      router.refresh();
    } catch (err) {
      console.error("[activate-user] network", err);
      toast.error("Erreur réseau");
      window.alert("Erreur réseau lors de l’activation");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="default"
      disabled={pending || disabled}
      className={cn(
        "min-h-9 shrink-0 font-semibold tracking-wide md:min-h-8",
        className,
      )}
      onClick={onActivate}
    >
      {pending ? "…" : "ACTIVER"}
    </Button>
  );
}
