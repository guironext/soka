export {};

type SokaJwtRole =
  | "ADMIN"
  | "COMITE_NATIONAL"
  | "CENTRE_GENERAL"
  | "CENTRE"
  | "CHAPITRE"
  | "DISTRICT"
  | "GROUPE"
  | "SOUS_GROUPE"
  | "MEMBRE"
  | "DEPARTMENT_COMITE_NATIONAL"
  | "DEPARTMENT_CENTRE_GENERAL"
  | "DEPARTMENT_CENTRE"
  | "DEPARTMENT_CHAPITRE"
  | "DEPARTMENT_DISTRICT"
  | "DEPARTMENT_GROUPE"
  | "DEPARTMENT_SOUS_GROUPE"
  | "DEPARTMENT_MEMBRE";

declare global {
  interface CustomJwtSessionClaims {
    /** Set via Clerk session token template using `{{user.public_metadata.sokaRole}}` */
    sokaRole?: SokaJwtRole | null;
    /** Set via Clerk session token template using `{{user.public_metadata.sokaPendingTargetRole}}` */
    sokaPendingTargetRole?: SokaJwtRole | null;
    metadata?: {
      role?: SokaJwtRole;
      onboardingCompleted?: boolean;
      sokaPendingTargetRole?: SokaJwtRole;
    };
  }
}
