import type { SignedInUser } from '../types/app';

export const EMPLOYEE_PROFILE_REQUIRED_MESSAGE =
  'No employee profile is linked. Your login email must match the email on your HR employee record in this organization.';

export function userHasEmployeeProfile(user: SignedInUser | null | undefined): boolean {
  return user?.employee_profile?.id != null;
}

export function isEmployeeProfileApiError(message: string | null | undefined): boolean {
  if (!message) {
    return false;
  }
  const m = message.toLowerCase();
  return m.includes('no employee profile') || m.includes('employee profile is linked');
}

export function friendlyModuleLoadError(message: string | null | undefined, fallback: string): string {
  if (isEmployeeProfileApiError(message)) {
    return EMPLOYEE_PROFILE_REQUIRED_MESSAGE;
  }
  return message?.trim() || fallback;
}

/** HR ESS modules that require a linked employee profile. */
export const HR_ESS_MODULE_ROUTES = new Set([
  'Leave Requests',
  'Leave balances',
  'Attendance',
]);

export function moduleRequiresEmployeeProfile(moduleRoute: string): boolean {
  return HR_ESS_MODULE_ROUTES.has(moduleRoute.trim());
}
