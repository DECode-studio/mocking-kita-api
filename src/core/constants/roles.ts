export enum AccountRole {
  MANAGER = 'Manager',
  PRODUCT_PROJECT_MANAGER = 'Product / Project Manager',
  BACKEND_DEVELOPER = 'Backend Developer',
  FRONTEND_DEVELOPER = 'Frontend Developer',
  MOBILE_DEVELOPER = 'Mobile Developer',
  QUALITY_ASSURANCE = 'Quality Assurance',
}

export const ROLES_LIST = Object.values(AccountRole);

export function canResetDatabase(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  return ['administrator', 'admin', 'manager'].includes(normalized);
}

