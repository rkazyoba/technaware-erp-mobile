/** Mirrors `App\Http\Resources\Api\UserResource` in danen-erp. */
export type EmployeeProfileSummary = {
  id: number;
  employee_code: string;
  name: string;
  photo_url?: string | null;
};

export type TenantRef = {
  id: number;
  name: string;
};

export type SignedInUser = {
  id: number;
  name: string;
  username: string;
  email: string;
  tenant_id: number | null;
  role_id: number | null;
  phone?: string | null;
  email_verified_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  photo_url?: string;
  has_custom_photo?: boolean;
  home_tenant?: TenantRef;
  employee_profile?: EmployeeProfileSummary | null;
};

export type TenantContextInfo = {
  home_tenant_id: number;
  home_tenant_name: string;
  active_tenant_id: number;
  active_tenant_name: string;
};

/** Mirrors `App\Support\ErpMobilePortalAccess::bootstrap()` payload. */
export type MobilePortalRow = {
  id: string;
  visible: boolean;
  label?: string;
  title?: string;
  hint?: string;
  route?: string;
  target_route?: string;
  tab?: string;
  category_key?: string;
  description?: string;
  sort_order?: number;
  target_tab?: string;
  /** Relative URL on the web ERP (e.g. `/accounting/journal-entries`). */
  web_path?: string;
};

/** Platform-owner admin organization switcher (mirrors web session switcher). */
export type TenantSwitcherInfo =
  | { enabled: false }
  | {
      enabled: true;
      context_tenant_id: number;
      home_tenant_id: number;
      overridden: boolean;
      tenants: Array<{ id: number; name: string }>;
    };

export type MobilePortalBootstrap = {
  has_wildcard: boolean;
  permissions: string[];
  role: { id: number; name: string } | null;
  tenant_id: number;
  employee_profile_linked?: boolean;
  tenant_modules: Record<string, boolean>;
  surfaces: MobilePortalRow[];
  quick_actions: MobilePortalRow[];
  tabs: MobilePortalRow[];
  tenant_switcher?: TenantSwitcherInfo;
  tenant_context?: TenantContextInfo;
};

export type RefreshProfileOptions = {
  /** Skip full-screen loading spinner (e.g. after tenant switch). */
  silent?: boolean;
};

export type AppTab = 'dashboard' | 'modules' | 'payslip' | 'reports';
