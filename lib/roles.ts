import type { Role } from "@/app/generated/prisma";

/**
 * Hierarchy index: higher number = higher authority (admin at top).
 * Main roles and parallel “department” roles are interleaved by level.
 */
export const ROLE_RANK: Record<Role, number> = {
  ADMIN: 20,
  COMITE_NATIONAL: 19,
  DEPARTMENT_COMITE_NATIONAL: 18,
  CENTRE_GENERAL: 17,
  DEPARTMENT_CENTRE_GENERAL: 16,
  CENTRE: 15,
  DEPARTMENT_CENTRE: 14,
  CHAPITRE: 13,
  DEPARTMENT_CHAPITRE: 12,
  DISTRICT: 11,
  DEPARTMENT_DISTRICT: 10,
  GROUPE: 9,
  DEPARTMENT_GROUPE: 8,
  SOUS_GROUPE: 7,
  DEPARTMENT_SOUS_GROUPE: 6,
  MEMBRE: 5,
  DEPARTMENT_MEMBRE: 4,
};

export type RoleRule = {
  targetRole: Role;
  /** Roles allowed to create an invitation for `targetRole`. */
  allowedIssuerRoles: Role[];
  /**
   * Two approvers required: one from each role listed (distinct users).
   * Order matches your spec (first / second validator).
   */
  requiredApproverRoles: [Role, Role];
};

/**
 * Invitation + dual-approval ladder (main track + parallel department track).
 */
export const ROLE_RULES: RoleRule[] = [
  {
    targetRole: "ADMIN",
    allowedIssuerRoles: ["ADMIN"],
    requiredApproverRoles: ["ADMIN", "COMITE_NATIONAL"],
  },
  {
    targetRole: "COMITE_NATIONAL",
    allowedIssuerRoles: ["ADMIN"],
    requiredApproverRoles: ["ADMIN", "COMITE_NATIONAL"],
  },
  {
    targetRole: "CENTRE_GENERAL",
    allowedIssuerRoles: ["COMITE_NATIONAL", "ADMIN"],
    requiredApproverRoles: ["COMITE_NATIONAL", "ADMIN"],
  },
  {
    targetRole: "CENTRE",
    allowedIssuerRoles: ["CENTRE_GENERAL", "COMITE_NATIONAL"],
    requiredApproverRoles: ["CENTRE_GENERAL", "COMITE_NATIONAL"],
  },
  {
    targetRole: "CHAPITRE",
    allowedIssuerRoles: ["CENTRE"],
    requiredApproverRoles: ["CENTRE", "CENTRE_GENERAL"],
  },
  {
    targetRole: "DISTRICT",
    allowedIssuerRoles: ["CHAPITRE", "CENTRE", "COMITE_NATIONAL"],
    requiredApproverRoles: ["CHAPITRE", "CENTRE"],
  },
  {
    targetRole: "GROUPE",
    allowedIssuerRoles: ["DISTRICT"],
    requiredApproverRoles: ["DISTRICT", "CHAPITRE"],
  },
  {
    targetRole: "SOUS_GROUPE",
    allowedIssuerRoles: ["GROUPE"],
    requiredApproverRoles: ["GROUPE", "DISTRICT"],
  },
  {
    targetRole: "MEMBRE",
    allowedIssuerRoles: ["SOUS_GROUPE", "GROUPE"],
    requiredApproverRoles: ["GROUPE", "DISTRICT"],
  },
  {
    targetRole: "DEPARTMENT_COMITE_NATIONAL",
    allowedIssuerRoles: ["ADMIN"],
    requiredApproverRoles: ["ADMIN", "COMITE_NATIONAL"],
  },
  {
    targetRole: "DEPARTMENT_CENTRE_GENERAL",
    allowedIssuerRoles: ["COMITE_NATIONAL", "ADMIN", "DEPARTMENT_COMITE_NATIONAL"],
    requiredApproverRoles: ["COMITE_NATIONAL", "ADMIN"],
  },
  {
    targetRole: "DEPARTMENT_CENTRE",
    allowedIssuerRoles: ["DEPARTMENT_CENTRE_GENERAL", "CENTRE_GENERAL"],
    requiredApproverRoles: ["DEPARTMENT_CENTRE_GENERAL", "COMITE_NATIONAL"],
  },
  {
    targetRole: "DEPARTMENT_CHAPITRE",
    allowedIssuerRoles: ["DEPARTMENT_CENTRE", "CENTRE"],
    requiredApproverRoles: ["DEPARTMENT_CENTRE", "DEPARTMENT_CENTRE_GENERAL"],
  },
  {
    targetRole: "DEPARTMENT_DISTRICT",
    allowedIssuerRoles: ["DEPARTMENT_CHAPITRE", "CHAPITRE"],
    requiredApproverRoles: ["DEPARTMENT_CHAPITRE", "DEPARTMENT_CENTRE"],
  },
  {
    targetRole: "DEPARTMENT_GROUPE",
    allowedIssuerRoles: ["DEPARTMENT_DISTRICT", "DISTRICT"],
    requiredApproverRoles: ["DEPARTMENT_DISTRICT", "DEPARTMENT_CHAPITRE"],
  },
  {
    targetRole: "DEPARTMENT_SOUS_GROUPE",
    allowedIssuerRoles: ["DEPARTMENT_GROUPE", "GROUPE"],
    requiredApproverRoles: ["DEPARTMENT_GROUPE", "DEPARTMENT_DISTRICT"],
  },
  {
    targetRole: "DEPARTMENT_MEMBRE",
    allowedIssuerRoles: ["DEPARTMENT_SOUS_GROUPE", "DEPARTMENT_GROUPE"],
    requiredApproverRoles: ["DEPARTMENT_GROUPE", "DEPARTMENT_DISTRICT"],
  },
];

/** Every role value (for URL parsing, etc.). Excludes nothing — mirrors Prisma `Role`. */
export const ALL_KNOWN_ROLES: readonly Role[] = [
  "ADMIN",
  "COMITE_NATIONAL",
  "CENTRE_GENERAL",
  "CENTRE",
  "CHAPITRE",
  "DISTRICT",
  "GROUPE",
  "SOUS_GROUPE",
  "MEMBRE",
  "DEPARTMENT_COMITE_NATIONAL",
  "DEPARTMENT_CENTRE_GENERAL",
  "DEPARTMENT_CENTRE",
  "DEPARTMENT_CHAPITRE",
  "DEPARTMENT_DISTRICT",
  "DEPARTMENT_GROUPE",
  "DEPARTMENT_SOUS_GROUPE",
  "DEPARTMENT_MEMBRE",
];

/**
 * Admin “Invitations” UI: all Prisma `Role` values, French labels, hierarchy-first order.
 */
export const ADMIN_INVITATION_ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "COMITE_NATIONAL", label: "Comité national" },
  { value: "DEPARTMENT_COMITE_NATIONAL", label: "Département — comité national" },
  { value: "CENTRE_GENERAL", label: "Centre général" },
  { value: "DEPARTMENT_CENTRE_GENERAL", label: "Département — centre général" },
  { value: "CENTRE", label: "Centre" },
  { value: "DEPARTMENT_CENTRE", label: "Département — centre" },
  { value: "CHAPITRE", label: "Chapitre" },
  { value: "DEPARTMENT_CHAPITRE", label: "Département — chapitre" },
  { value: "DISTRICT", label: "District" },
  { value: "DEPARTMENT_DISTRICT", label: "Département — district" },
  { value: "GROUPE", label: "Groupe" },
  { value: "DEPARTMENT_GROUPE", label: "Département — groupe" },
  { value: "SOUS_GROUPE", label: "Sous-groupe" },
  { value: "DEPARTMENT_SOUS_GROUPE", label: "Département — sous-groupe" },
  { value: "MEMBRE", label: "Membre" },
  { value: "DEPARTMENT_MEMBRE", label: "Département — membre" },
  { value: "ADMIN", label: "Administrateur" },
];

const ruleByTarget = new Map<Role, RoleRule>(
  ROLE_RULES.map((r) => [r.targetRole, r]),
);

export function getRuleForTargetRole(targetRole: Role): RoleRule | undefined {
  return ruleByTarget.get(targetRole);
}

export function canIssueInvitation(issuerRole: Role, targetRole: Role): boolean {
  if (issuerRole === "ADMIN" && (ALL_KNOWN_ROLES as readonly Role[]).includes(targetRole)) {
    return true;
  }
  const rule = getRuleForTargetRole(targetRole);
  if (!rule) return false;
  return rule.allowedIssuerRoles.includes(issuerRole);
}

/** Roles this issuer may create invitations for (per {@link ROLE_RULES}). */
export function getIssuableTargetRoles(issuerRole: Role): Role[] {
  if (issuerRole === "ADMIN") {
    return [...ALL_KNOWN_ROLES];
  }
  return ROLE_RULES.filter((r) => r.allowedIssuerRoles.includes(issuerRole)).map(
    (r) => r.targetRole,
  );
}

export function getRequiredApproverRoles(targetRole: Role): [Role, Role] | null {
  const rule = getRuleForTargetRole(targetRole);
  return rule ? rule.requiredApproverRoles : null;
}

/**
 * When JWT / DB `role` is one of these and `pendingTargetRole` is set, prefer the pending
 * role’s dashboard (see `middleware.ts` redirect logic).
 */
export const ROLES_WITH_PENDING_TARGET_REDIRECT = new Set<Role>([
  "COMITE_NATIONAL",
  "CENTRE_GENERAL",
  "CENTRE",
  "CHAPITRE",
  "DISTRICT",
  "GROUPE",
  "SOUS_GROUPE",
  "MEMBRE",
]);

/** Post-onboarding home path per role (keep in sync with `middleware.ts` ROLE_ACCESS). */
export const ROLE_DASHBOARD_PATH: Record<Role, string> = {
  ADMIN: "/admin",
  COMITE_NATIONAL: "/comite_national",
  CENTRE_GENERAL: "/centre_general",
  CENTRE: "/centre",
  CHAPITRE: "/chapitre",
  DISTRICT: "/district",
  GROUPE: "/groupe",
  SOUS_GROUPE: "/sous_groupe",
  MEMBRE: "/membre",
  DEPARTMENT_COMITE_NATIONAL: "/departement-comite-national",
  DEPARTMENT_CENTRE_GENERAL: "/departement-centre-general",
  DEPARTMENT_CENTRE: "/departement-centre",
  DEPARTMENT_CHAPITRE: "/departement-chapitre",
  DEPARTMENT_DISTRICT: "/departement-district",
  DEPARTMENT_GROUPE: "/departement-groupe",
  DEPARTMENT_SOUS_GROUPE: "/departement-sous-groupe",
  DEPARTMENT_MEMBRE: "/departement-membre",
};

export function dashboardPathForRole(role: Role): string {
  return ROLE_DASHBOARD_PATH[role] ?? "/";
}

export function isAdmin(role: Role | null | undefined): boolean {
  return role === "ADMIN";
}
