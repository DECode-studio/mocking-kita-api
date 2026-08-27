export enum AccountRole {
  ADMINISTRATOR = 'Administrator',
  MANAGER = 'Manager',
  PRODUCT_PROJECT_MANAGER = 'Product / Project Manager',
  BACKEND_DEVELOPER = 'Backend Developer',
  FRONTEND_DEVELOPER = 'Frontend Developer',
  MOBILE_DEVELOPER = 'Mobile Developer',
  QUALITY_ASSURANCE = 'Quality Assurance',
}

export const ROLES_LIST = [
  AccountRole.PRODUCT_PROJECT_MANAGER,
  AccountRole.BACKEND_DEVELOPER,
  AccountRole.FRONTEND_DEVELOPER,
  AccountRole.MOBILE_DEVELOPER,
  AccountRole.QUALITY_ASSURANCE,
];

export function hasAdminAuthority(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  return ['administrator', 'admin', 'manager'].includes(normalized);
}

export function canResetDatabase(role?: string | null): boolean {
  return hasAdminAuthority(role);
}


