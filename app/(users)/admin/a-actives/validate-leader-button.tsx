"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  className?: string;
};

export function ValidateLeaderButton({ userId, className }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onValidate() {
    setPending(true);
    try {
      const res = await fetch("/api/admin/validate-leader", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Échec de la validation");
        return;
      }
      toast.success("Compte validé — l’utilisateur peut accéder à son espace rôle.");
      router.refresh();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="default"
      disabled={pending}
      className={cn(
        "min-h-9 shrink-0 font-semibold tracking-wide md:min-h-8",
        className,
      )}
      onClick={onValidate}
    >
      {pending ? "…" : "VALIDER"}
    </Button>
  );
}
