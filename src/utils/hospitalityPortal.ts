/** Portal route labels with native mobile list/detail UI (not web-only). */
export const HOSPITALITY_NATIVE_MODULE_ROUTES = [
  'Front desk',
  'Housekeeping',
  'Hospitality overview',
  'Reservations',
  'Guests',
  'Folios & billing',
  'Rate catalog',
  'Rooms & inventory',
  'Reservation sales',
  'Channel manager',
  'Hospitality reports',
] as const;

export type HospitalityNativeModuleRoute = (typeof HOSPITALITY_NATIVE_MODULE_ROUTES)[number];

export function isHospitalityNativeModule(moduleRoute: string): boolean {
  return HOSPITALITY_NATIVE_MODULE_ROUTES.includes(moduleRoute.trim() as HospitalityNativeModuleRoute);
}
