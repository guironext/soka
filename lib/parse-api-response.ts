export type ApiJsonBody = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

/**
 * Reads the response body as text, then parses JSON when possible.
 * Empty 2xx bodies are treated as `{ ok, body: null }` so success flows still work.
 */
export async function readApiJson(res: Response): Promise<{
  ok: boolean;
  status: number;
  body: ApiJsonBody | null;
}> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: res.ok, status: res.status, body: null };
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { ok: res.ok, status: res.status, body: parsed as ApiJsonBody };
    }
    return { ok: res.ok, status: res.status, body: null };
  } catch {
    return { ok: res.ok, status: res.status, body: null };
  }
}

export function messageForApiFailure(status: number): string {
  if (status === 401) {
    return "Session expirée ou non autorisée. Reconnectez-vous.";
  }
  if (status === 403) {
    return "Accès refusé.";
  }
  if (status === 404) {
    return "Ressource introuvable.";
  }
  if (status >= 500) {
    return `Erreur serveur (${status}). Réessayez plus tard ou contactez le support.`;
  }
  return `La requête a échoué (code ${status}). Réessayez.`;
}

export function firstFieldError(body: ApiJsonBody | null): string | null {
  if (!body?.fieldErrors) return null;
  const fe = body.fieldErrors;
  return (
    fe.firstName?.[0] ??
    fe.lastName?.[0] ??
    fe.phone?.[0] ??
    null
  );
}
