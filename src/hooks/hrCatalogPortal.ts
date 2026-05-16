import {
  getHrDepartmentDetail,
  getHrDepartments,
  getHrJobGradeDetail,
  getHrJobGrades,
  getHrLeaveTypeDetail,
  getHrLeaveTypes,
  getHrPayrollRunDetail,
  getHrPayrollRuns,
  getHrPositionDetail,
  getHrPositions,
  type HrDepartmentDetail,
  type HrLeaveTypeDetail,
  type HrMasterListItem,
  type HrPositionDetail,
  type PayrollRunDetail,
  type PayrollRunListItem,
} from '../api';
import type { RecordDetailParams } from '../navigation/moduleStackTypes';

export const HR_CATALOG_ROUTES = [
  'Departments',
  'Positions',
  'Job grades',
  'Leave types',
  'Payroll runs',
] as const;

export type HrCatalogRoute = (typeof HR_CATALOG_ROUTES)[number];

export type HrCatalogDetail =
  | HrDepartmentDetail
  | HrPositionDetail
  | HrMasterListItem
  | HrLeaveTypeDetail
  | PayrollRunDetail;

export type HrCatalogSlice<TDetail, TListItem = HrMasterListItem> = {
  items: TListItem[];
  detail: TDetail | null;
  page: number;
  hasMore: boolean;
  updatedAt: string | null;
  searchInput: string;
  queryCommitted: string;
};

function emptySlice<TDetail, TListItem = HrMasterListItem>(): HrCatalogSlice<TDetail, TListItem> {
  return {
    items: [],
    detail: null,
    page: 1,
    hasMore: false,
    updatedAt: null,
    searchInput: '',
    queryCommitted: '',
  };
}

export type HrCatalogState = {
  Departments: HrCatalogSlice<HrDepartmentDetail>;
  Positions: HrCatalogSlice<HrPositionDetail>;
  'Job grades': HrCatalogSlice<HrMasterListItem>;
  'Leave types': HrCatalogSlice<HrLeaveTypeDetail>;
  'Payroll runs': HrCatalogSlice<PayrollRunDetail, PayrollRunListItem>;
};

export function emptyHrCatalogState(): HrCatalogState {
  return {
    Departments: emptySlice<HrDepartmentDetail>(),
    Positions: emptySlice<HrPositionDetail>(),
    'Job grades': emptySlice<HrMasterListItem>(),
    'Leave types': emptySlice<HrLeaveTypeDetail>(),
    'Payroll runs': emptySlice<PayrollRunDetail, PayrollRunListItem>(),
  };
}

export function hrCatalogRouteForDetailKind(
  kind: RecordDetailParams['detailKind']
): HrCatalogRoute | null {
  switch (kind) {
    case 'hr_department':
      return 'Departments';
    case 'hr_position':
      return 'Positions';
    case 'hr_job_grade':
      return 'Job grades';
    case 'hr_leave_type':
      return 'Leave types';
    case 'hr_payroll_run':
      return 'Payroll runs';
    default:
      return null;
  }
}

export function hrCatalogDetailKind(route: HrCatalogRoute): RecordDetailParams['detailKind'] {
  switch (route) {
    case 'Departments':
      return 'hr_department';
    case 'Positions':
      return 'hr_position';
    case 'Job grades':
      return 'hr_job_grade';
    case 'Leave types':
      return 'hr_leave_type';
    case 'Payroll runs':
      return 'hr_payroll_run';
    default:
      return 'hr_department';
  }
}

export function hrCatalogSearchPlaceholder(route: HrCatalogRoute): string {
  switch (route) {
    case 'Departments':
      return 'Search department name';
    case 'Positions':
      return 'Search position title';
    case 'Job grades':
      return 'Search job grade';
    case 'Leave types':
      return 'Search leave type';
    case 'Payroll runs':
      return 'Search payroll run or period';
    default:
      return 'Search';
  }
}

export function hrCatalogListLabel(item: HrMasterListItem | PayrollRunListItem, route: HrCatalogRoute): string {
  if (route === 'Payroll runs') {
    return (item as PayrollRunListItem).ref;
  }
  return (item as HrMasterListItem).name;
}

export function hrCatalogListSubtitle(item: HrMasterListItem | PayrollRunListItem, route: HrCatalogRoute): string {
  if (route === 'Payroll runs') {
    const run = item as PayrollRunListItem;
    const period =
      run.period_start && run.period_end ? `${run.period_start} – ${run.period_end}` : run.period_start ?? '';
    return period || run.status_label || '';
  }
  return (item as HrMasterListItem).subtitle ?? '';
}

export function hrCatalogListStatus(item: HrMasterListItem | PayrollRunListItem, route: HrCatalogRoute): string {
  if (route === 'Payroll runs') {
    return (item as PayrollRunListItem).status_label || (item as PayrollRunListItem).status;
  }
  return (item as HrMasterListItem).status;
}

export async function fetchHrCatalogList(
  token: string,
  route: HrCatalogRoute,
  page: number,
  perPage: number,
  query: string
) {
  switch (route) {
    case 'Departments':
      return getHrDepartments(token, page, perPage, query);
    case 'Positions':
      return getHrPositions(token, page, perPage, query);
    case 'Job grades':
      return getHrJobGrades(token, page, perPage, query);
    case 'Leave types':
      return getHrLeaveTypes(token, page, perPage, query);
    case 'Payroll runs':
      return getHrPayrollRuns(token, page, perPage, query);
    default:
      return getHrDepartments(token, page, perPage, query);
  }
}

export async function fetchHrCatalogDetail(token: string, route: HrCatalogRoute, id: string) {
  switch (route) {
    case 'Departments':
      return getHrDepartmentDetail(token, id);
    case 'Positions':
      return getHrPositionDetail(token, id);
    case 'Job grades':
      return getHrJobGradeDetail(token, id);
    case 'Leave types':
      return getHrLeaveTypeDetail(token, id);
    case 'Payroll runs':
      return getHrPayrollRunDetail(token, id);
    default:
      return getHrDepartmentDetail(token, id);
  }
}

export function isHrCatalogRoute(route: string): route is HrCatalogRoute {
  return (HR_CATALOG_ROUTES as readonly string[]).includes(route);
}
