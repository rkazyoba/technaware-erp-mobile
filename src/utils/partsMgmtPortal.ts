/** Mobile module routes for parts management (beyond catalog). */
export const PARTS_IN_STORE_ROUTE = 'Parts in store';
export const PART_EXPIRATION_ROUTE = 'Part expiration';
export const PART_CONVERSIONS_ROUTE = 'Part conversions';
export const PRICE_CATALOG_ROUTE = 'Price catalog';

export const PARTS_MGMT_MODULE_ROUTES = [
  PARTS_IN_STORE_ROUTE,
  PART_EXPIRATION_ROUTE,
  PART_CONVERSIONS_ROUTE,
  PRICE_CATALOG_ROUTE,
] as const;

export type PartsMgmtModuleRoute = (typeof PARTS_MGMT_MODULE_ROUTES)[number];

export function isPartsMgmtModuleRoute(route: string): route is PartsMgmtModuleRoute {
  return (PARTS_MGMT_MODULE_ROUTES as readonly string[]).includes(route.trim());
}
