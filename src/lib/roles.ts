// ═══════════════════════════════════════════════════════════════════════════════
// RBAC Helpers — Role-Based Access Control for ICT Survey Portal
// Mirrors the M365 License Portal RBAC patterns
// ═══════════════════════════════════════════════════════════════════════════════

export const ROLES = {
  TENANT_IT:        'TENANT_IT',
  TENANT_ADMIN:     'TENANT_ADMIN',
  TENANT_VIEWER:    'TENANT_VIEWER',
  CENTRAL_APPROVER: 'CENTRAL_APPROVER',
  CENTRAL_IT:       'CENTRAL_IT',
  CENTRAL_VIEWER:   'CENTRAL_VIEWER',
} as const;

export type RoleKey = keyof typeof ROLES;

export const ROLE_LABELS: Record<string, string> = {
  TENANT_IT:        'Institute IT Officer',
  TENANT_ADMIN:     'Institute Administrator',
  TENANT_VIEWER:    'Institute Viewer',
  CENTRAL_APPROVER: 'MDS Approver',
  CENTRAL_IT:       'MDS System Admin',
  CENTRAL_VIEWER:   'MDS Auditor',
};

// ── Permission checks ──

/** Central MDS roles that can see all institutes */
export function isCentral(role: string): boolean {
  return ['CENTRAL_APPROVER', 'CENTRAL_IT', 'CENTRAL_VIEWER'].includes(role);
}

/** Can create/edit surveys */
export function canCreateSurvey(role: string): boolean {
  return ['TENANT_IT', 'CENTRAL_IT'].includes(role);
}

/** Can submit a draft survey */
export function canSubmitSurvey(role: string): boolean {
  return ['TENANT_IT', 'CENTRAL_IT'].includes(role);
}

/** Can approve at institute level */
export function canInstituteApprove(role: string): boolean {
  return ['TENANT_ADMIN'].includes(role);
}

/** Can review at MDS level */
export function canMdsReview(role: string): boolean {
  return ['CENTRAL_APPROVER', 'CENTRAL_IT'].includes(role);
}

/** Can complete/finalize a survey */
export function canComplete(role: string): boolean {
  return ['CENTRAL_IT'].includes(role);
}

/** Can upload attachments */
export function canUploadAttachment(role: string): boolean {
  return ['TENANT_IT', 'TENANT_ADMIN', 'CENTRAL_IT'].includes(role);
}

/** Can view cost/price columns */
export function canViewCosts(role: string): boolean {
  return ['TENANT_IT', 'TENANT_ADMIN', 'CENTRAL_APPROVER', 'CENTRAL_IT'].includes(role);
}

/** Can print reports */
export function canPrintReports(role: string): boolean {
  // All roles can print their own org reports; central can print all
  return true;
}

/** Can view ALL organizations' data */
export function canViewAllOrgs(role: string): boolean {
  return isCentral(role);
}

/** Can manage users */
export function canManageUsers(role: string): boolean {
  return ['TENANT_ADMIN', 'CENTRAL_IT'].includes(role);
}

/** Get org filter for Prisma queries — central sees all, tenants see their own */
export function getOrgFilter(role: string, organizationId: string | null) {
  if (isCentral(role)) return {};
  return { organizationId: organizationId || 'none' };
}

/** Get survey filter  — central sees all, tenants see own org surveys */
export function getSurveyFilter(role: string, organizationId: string | null) {
  if (isCentral(role)) return {};
  return { survey: { organizationId: organizationId || 'none' } };
}
