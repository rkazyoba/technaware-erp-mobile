# Web ERP ↔ Mobile app parity

This document maps **Laravel web** navigation (`resources/views/template/partials/erp_sidebar.blade.php`, `App\Support\ErpSidebarNav`, `config/erp_nav.php`) to the **Expo mobile** app (`config/erp_mobile_portal.php` in **danen-erp**, `src/` in **erp-mobile**).

**Design system for mobile:** `requirement.md`, `technaware_erp_mobile_prompt.md`, and `src/constants/colors.ts` / `modulePresentation.ts`. New surfaces should reuse **TopBar**, **StatusBadge**, card tokens (`PAGE_BG`, `SURFACE`, `BORDER_SUBTLE`), and section labels from those files.

---

## Summary

| Tier | Meaning |
|------|--------|
| **Shipped** | User-visible module in mobile portal + list/detail (or tab) wired to API |
| **Partial** | Summary, approvals, or web-only slice exists; not a full CRUD mirror |
| **Web-only** | No mobile surface; would need **API + UI** (often low value on phone) |
| **Approvals only** | Decisions via **Approvals** / unified approval API, not dedicated module list |

The mobile product is **staff / warehouse / field** oriented. **Platform admin**, **accounting COA**, **full HR master data**, and **large tabular reports** remain web-first unless you explicitly prioritize them.

---

## Section-by-section matrix

### Dashboard

| Web | Mobile |
|-----|--------|
| Overview, CRM, Procurement, Inventory, Finance, HR dashboards | **Home** screen: greeting, stats, quick actions, approval queue preview — **not** separate per-domain dashboard URLs |

**Gap / design:** Home should continue to **echo** web dashboard *metrics* (where `/mobile/summary` exposes them), not replicate every web dashboard tile.

---

### Company & locations

| Web | Mobile |
|-----|--------|
| Company, banks, sites, stores | **Web-only** today |

**If needed later:** read-only “My site / store” context is already part of staff logistics APIs; full company master data is unlikely on mobile.

---

### Administration & platform

| Web | Mobile |
|-----|--------|
| Users, roles, permissions, tenants, license plans, tenant settings, audit, bulk import, scheduler, DB seeds | **Web-only** |
| Summary: tenant switcher (platform admins) | **Summary** tab when `tenant_switcher` is present in portal payload |

---

### Master data (catalog)

| Web | Mobile |
|-----|--------|
| Units, categories, products, price catalog, bank masters, mobile operators, suppliers | **Web-only** (except **Part catalog** below) |

---

### CRM & quotations

| Web | Mobile |
|-----|--------|
| CRM overview, customers, contracts | **Web-only** |
| Quotations list / approve | **Approvals only** (if approval kinds exposed) |

**Gap:** Dedicated **Customers / contracts** mobile modules need new APIs + screens.

---

### Procurement

| Web | Mobile |
|-----|--------|
| Requisitions, approve requisitions | **Requisitions** surface (`/requisitions`) |
| Purchase orders, approve POs, daily purchase report | **Web-only** for PO lists/reports; PO-related **GRN** is covered under inventory |

---

### Stock & parts (web “Stock & parts” + catalog parts)

| Web | Mobile |
|-----|--------|
| Parts catalog, price catalog, conversions, in-store, expiration | **Part catalog** (`/parts`) — list + detail |
| Stock report, supplier-wise stock | **Stock by store** (`/inventory/stock-report/*`) |

**Gap:** Part conversions, expiration calendar, supplier-wise report as **dedicated** mobile flows.

---

### Inventory & logistics

| Web | Mobile |
|-----|--------|
| PO receipts (GRN), approve | **GRN (PO)** |
| Non-PO receipts, approve | **Non-PO receipts** |
| Supplier returns, approve | **Supplier returns** |
| Store issue / receipt / approvals | **Store movements** (kitchen↔store, inter-store) |
| Pick tickets | **Pick tickets** |
| Delivery notes, approve | **Delivery notes** |

**Gap:** Create/edit flows parity with web forms (fields, validations, attachments) is **per-module** polish, not “missing route.”

---

### Finance & commercial

| Web | Mobile |
|-----|--------|
| Invoices, proforma, payments, vouchers, supplier invoices + approvals | **Partial:** revenue / invoice **snippets** on Home when permitted; finance approvals via **Approvals** where kinds exist |
| Daily reports, statements, overdue, accounting reports | **Web-only** |

**Gap:** Full mobile **Finance** hub would need multiple new read APIs and report viewers.

---

### Accounting

| Web | Mobile |
|-----|--------|
| Periods, COA, journals, fixed assets, depreciation, bank reconciliation, cash flow map, currencies, WHT types | **Web-only** |

---

### HR & payroll

| Web | Mobile |
|-----|--------|
| Full HR master (employees, grades, departments, statutory returns, payroll setup, …) | **Web-only** |
| ESS leave, attendance (employee) | **Leave Requests**, **Attendance**, **Payroll** tab (payslips) |

---

### Archive (historic)

| Web | Mobile |
|-----|--------|
| Historic customers, products, contracts, invoices, proformas | **Web-only** |

---

### Support

| Web | Mobile |
|-----|--------|
| My tickets / support desk | **Support** tickets API + UI (where enabled) |

---

### Workflow (mobile grouping)

| Surface | Web analogue |
|---------|----------------|
| Notifications | In-app notifications (web header / notification center) |
| Approvals | Web approval queues across modules |
| Support | Support tickets |

---

## Where to add a new mobile “view”

1. **Backend:** `danen-erp/config/erp_mobile_portal.php` — new row in `surfaces` with `permissions_any`, optional `tenant_module` / `tenant_feature`, `category_key`, `sort_order`.
2. **Bootstrap:** `App\Support\ErpMobilePortalAccess` resolves visibility (already driven by config).
3. **Mobile:** `AppNavigator` / route name matching `route` field; `ModuleListScreen` + `RecordDetailScreen` or new screen; `src/api.ts` if new endpoints.
4. **Presentation:** `src/constants/modulePresentation.ts` — `MODULE_ICON`, `colorFamilyForSurfaceId`, and `CATEGORY_LABELS` if you introduce a new `category_key`.

---

## Suggested phases (execution order)

1. **UX parity on shipped modules** — Align list filters, badges, empty states, and detail layouts with web terminology (`ModuleListScreen`, `RecordDetailScreen`, requirement images).
2. **Home / Summary** — Match web dashboard *language* and KPIs supported by `MobileSummaryController`.
3. **Read-only CRM / PO / invoice lists** — New APIs + portal rows (medium effort).
4. **Finance reports & accounting** — Low priority on mobile; consider **PDF links** or webview to web reports if required.
5. **Admin & master data** — Keep on web unless you have a strong mobile admin story.

---

## File reference cheat sheet

| Concern | Repository | File |
|--------|------------|------|
| Web nav keys → permissions | danen-erp | `config/erp_nav.php` |
| Web route names | danen-erp | `app/Support/ErpSidebarNav.php` |
| Sidebar structure | danen-erp | `resources/views/template/partials/erp_sidebar.blade.php` |
| Mobile manifest | danen-erp | `config/erp_mobile_portal.php` |
| Mobile API v1 | danen-erp | `routes/api.php` |
| Mobile UI & tokens | erp-mobile | `requirement.md`, `technaware_erp_mobile_prompt.md`, `src/constants/*` |

Last updated from codebase review (staff portal + API routes inventory).
