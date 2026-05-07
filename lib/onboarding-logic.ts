import type { OnboardingApproval, Role } from "@/app/generated/prisma";
import { getRequiredApproverRoles } from "@/lib/roles";

/**
 * Returns which required approver role slots are still missing.
 */
export function getMissingApproverRoles(
  targetRole: Role,
  approvals: Pick<OnboardingApproval, "approverRole">[],
): Role[] {
  const required = getRequiredApproverRoles(targetRole);
  if (!required) return [];

  const [a, b] = required;

  const hasA = approvals.some((x) => x.approverRole === a);
  const hasB = approvals.some((x) => x.approverRole === b);
  const missing: Role[] = [];
  if (!hasA) missing.push(a);
  if (!hasB) missing.push(b);
  return missing;
}

export function isOnboardingComplete(
  targetRole: Role,
  approvals: Pick<OnboardingApproval, "approverRole">[],
): boolean {
  return getMissingApproverRoles(targetRole, approvals).length === 0;
}
