import type { Role } from "@/app/generated/prisma";

/**
 * Hierarchy index: higher number = higher authority (admin at top).
 */
export const ROLE_RANK: Record<Role, number> = {
  ADMIN: 9,
  COMITE_NATIONAL: 8,
  CENTRE_GENERAL: 7,
  CENTRE: 6,
  CHAPITRE: 5,
  DISTRICT: 4,
  GROUPE: 3,
  SOUS_GROUPE: 2,
  MEMBRE: 1,
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
 * Invitation + dual-approval ladder (Comité National needs Admin + one CN member).
 */
export const ROLE_RULES: RoleRule[] = [
  {
    targetRole: "COMITE_NATIONAL",
    allowedIssuerRoles: ["ADMIN"],
    requiredApproverRoles: ["ADMIN", "COMITE_NATIONAL"],
  },
  {
    targetRole: "CENTRE_GENERAL",
    allowedIssuerRoles: ["COMITE_NATIONAL"],
    requiredApproverRoles: ["COMITE_NATIONAL", "ADMIN"],
  },
  {
    targetRole: "CENTRE",
    allowedIssuerRoles: ["CENTRE_GENERAL"],
    requiredApproverRoles: ["CENTRE_GENERAL", "COMITE_NATIONAL"],
  },
  {
    targetRole: "CHAPITRE",
    allowedIssuerRoles: ["CENTRE"],
    requiredApproverRoles: ["CENTRE", "CENTRE_GENERAL"],
  },
  {
    targetRole: "DISTRICT",
    allowedIssuerRoles: ["CHAPITRE"],
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
];

const ruleByTarget = new Map<Role, RoleRule>(
  ROLE_RULES.map((r) => [r.targetRole, r]),
);

export function getRuleForTargetRole(targetRole: Role): RoleRule | undefined {
  return ruleByTarget.get(targetRole);
}

export function canIssueInvitation(issuerRole: Role, targetRole: Role): boolean {
  const rule = getRuleForTargetRole(targetRole);
  if (!rule) return false;
  return rule.allowedIssuerRoles.includes(issuerRole);
}

export function getRequiredApproverRoles(targetRole: Role): [Role, Role] | null {
  const rule = getRuleForTargetRole(targetRole);
  return rule ? rule.requiredApproverRoles : null;
}

export function isAdmin(role: Role | null | undefined): boolean {
  return role === "ADMIN";
}
