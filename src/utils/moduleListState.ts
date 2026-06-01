import type { StaffPortalModel } from '../hooks/useStaffPortalModel';
import { isHrCatalogRoute } from '../hooks/hrCatalogPortal';
import { isLogisticsModule } from '../hooks/useStaffPortalModel';
import { isAccountingApiListModule } from './accountingPortal';
import { isFinanceReportMobileModule } from './financeReportPortal';
import { isHospitalityNativeModule } from './hospitalityPortal';
import { isOperationalReportMobileModule } from './operationalReportPortal';
import { webPathForPortalSurface } from './portalWebSurfaces';

/** Whether the active module list already has rows to show (skip loading placeholder). */
export function moduleListHasItems(moduleRoute: string, sp: StaffPortalModel): boolean {
  if (isFinanceReportMobileModule(moduleRoute) || isOperationalReportMobileModule(moduleRoute)) {
    return true;
  }
  if (isAccountingApiListModule(moduleRoute)) {
    return sp.accountingListRoute === moduleRoute && sp.accountingListItems.length > 0;
  }
  if (webPathForPortalSurface(moduleRoute, sp.portal) && moduleRoute !== 'Stock by store' && !isHospitalityNativeModule(moduleRoute)) {
    return true;
  }
  if (isHrCatalogRoute(moduleRoute)) {
    return sp.hrCatalog[moduleRoute].items.length > 0;
  }
  if (isLogisticsModule(moduleRoute)) {
    return sp.logisticsItems.length > 0;
  }
  switch (moduleRoute) {
    case 'Requisitions':
      return sp.requisitionItems.length > 0;
    case 'Purchase orders':
      return sp.purchaseOrderItems.length > 0;
    case 'Customer invoices':
      return sp.customerInvoiceItems.length > 0;
    case 'Proforma invoices':
      return sp.proformaInvoiceItems.length > 0;
    case 'Customer payments':
      return sp.paymentItems.length > 0;
    case 'Payment vouchers':
      return sp.paymentVoucherItems.length > 0;
    case 'Supplier invoices':
      return sp.supplierInvoiceItems.length > 0;
    case 'Employees':
      return sp.employeeItems.length > 0;
    case 'Leave balances':
      return sp.leaveBalanceItems.length > 0;
    case 'Leave Requests':
      return sp.leaveRequests.length > 0;
    case 'Notifications':
      return sp.notifications.length > 0;
    case 'Support':
      return sp.supportTickets.length > 0;
    case 'Customers':
      return sp.crmCustomerItems.length > 0;
    case 'Contracts':
      return sp.crmContractItems.length > 0;
    case 'Quotations':
      return sp.crmQuotationItems.length > 0;
    case 'Suppliers':
      return sp.supplierItems.length > 0;
    case 'Units':
      return sp.unitItems.length > 0;
    case 'Categories':
      return sp.categoryItems.length > 0;
    case 'Banks':
      return sp.bankMasterItems.length > 0;
    case 'Bank branches':
      return sp.bankBranchItems.length > 0;
    case 'Mobile operators':
      return sp.mobileOperatorItems.length > 0;
    case 'Part catalog':
      return sp.partItems.length > 0;
    case 'Stock by store':
      return sp.stockStores.length > 0 || sp.stockLines.length > 0;
    case 'Attendance':
      return sp.attendanceItems.length > 0;
    case 'Front desk':
      return (sp.hospitalityFrontDesk?.arrivals.length ?? 0) > 0
        || (sp.hospitalityFrontDesk?.departures.length ?? 0) > 0
        || (sp.hospitalityFrontDesk?.in_house.length ?? 0) > 0;
    case 'Housekeeping':
      return (sp.hospitalityHousekeeping?.rooms.length ?? 0) > 0;
    case 'Reservations':
      return sp.hospitalityReservationItems.length > 0;
    case 'Guests':
      return sp.hospitalityGuestItems.length > 0;
    case 'Folios & billing':
      return sp.hospitalityFolioItems.length > 0 || sp.hospitalityFolioDetail !== null;
    case 'Hospitality overview':
      return sp.hospitalityOverview !== null;
    case 'Rate catalog':
      return (sp.hospitalityRateCatalog?.items.length ?? 0) > 0;
    case 'Rooms & inventory':
      return (sp.hospitalityRoomsInventory?.room_classes.length ?? 0) > 0;
    case 'Reservation sales':
      return sp.hospitalitySalesItems.length > 0;
    case 'Channel manager':
      return (sp.hospitalityChannelManager?.accounts.length ?? 0) > 0;
    case 'Hospitality reports':
      return sp.hospitalityReports !== null;
    case 'Approvals':
      return sp.approvalItems.length > 0;
    default:
      return false;
  }
}
