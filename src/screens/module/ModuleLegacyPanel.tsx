import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Text, TextInput } from '../../components/AppTypography';
import { DatePickerField } from '../../components/DatePickerField';
import { ModuleSearchToolbar } from '../../components/ModuleSearchToolbar';
import { StoreStrip } from '../../components/StoreStrip';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useStaffPortal } from '../../context/StaffPortalContext';
import { isLogisticsModule, logisticsPathFor } from '../../hooks/useStaffPortalModel';
import { styles } from '../../styles/appStyles';

export function ModuleLegacyPanel() {
  const sp = useStaffPortal();
  const {
    token,
    user,
    portal,
    activeTab,
    selectedModule,
    loading,
    onSetTab,
    onRefreshProfile,
    onLogout,
    onOpenAction,
    setPortalSelectedModule,
    appBaseUrl,
    approvalDetail,
    approvalHasMore,
    approvalItems,
    approvalNotes,
    approvalPage,
    approvalsUpdatedAt,
    attendanceFrom,
    attendanceItems,
    attendanceUpdatedAt,
    cancelOpenedSupportTicket,
    canViewMobilePurchaseOrders,
    canViewMobileRequisitions,
    dashboardSummaryTiles,
    fetchLogisticsDetail,
    fetchLogisticsDocuments,
    fetchPartDetail,
    fetchPartsCatalog,
    fetchStockLines,
    formatNow,
    insets,
    leaveDetail,
    leaveEnd,
    leaveHasMore,
    leaveNotes,
    leavePage,
    leaveRequests,
    leaveStart,
    leaveTypeId,
    leaveTypes,
    leaveUpdatedAt,
    loadApprovalDetail,
    loadApprovals,
    loadAttendance,
    loadLeaveRequestDetail,
    loadLeaveRequests,
    loadMobileSummary,
    loadNotifications,
    loadPayslipDetail,
    loadPayslips,
    loadRequisitionDetail,
    loadPurchaseOrderDetail,
    loadPurchaseOrders,
    loadRequisitions,
    loadBankBranchDetail,
    loadBankBranches,
    loadBankMasterDetail,
    loadBanks,
    loadCategories,
    loadCategoryDetail,
    loadMobileOperatorDetail,
    loadMobileOperators,
    loadUnitDetail,
    loadUnits,
    loadSupplierDetail,
    loadSuppliers,
    loadStockStores,
    loadSupportDetail,
    loadSupportTickets,
    logisticsDetail,
    logisticsDetailFetchSeqRef,
    logisticsHasMore,
    logisticsItems,
    logisticsListFetchSeqRef,
    logisticsPage,
    logisticsQueryCommitted,
    logisticsSearchInput,
    logisticsTotal,
    logisticsUpdatedAt,
    logoUri,
    markAllRead,
    markOneNotificationRead,
    menuItems,
    mobileSummary,
    mobileSummaryError,
    mobileSummaryUpdatedAt,
    moduleError,
    moduleLoading,
    navChips,
    notificationHasMore,
    notificationPage,
    notificationUnreadCount,
    notifications,
    notificationsShortcutVisible,
    notificationsUpdatedAt,
    onPullRefresh,
    openNotificationTarget,
    partCatalogFetchSeqRef,
    partDetail,
    partDetailFetchSeqRef,
    partHasMore,
    partItems,
    partListTotal,
    partPage,
    partQueryCommitted,
    partSearchInput,
    partsUpdatedAt,
    payrollError,
    payrollLoading,
    payslipDetail,
    payslipItems,
    payslipsUpdatedAt,
    purchaseOrderDetail,
    purchaseOrderHasMore,
    purchaseOrderItems,
    purchaseOrderPage,
    purchaseOrdersUpdatedAt,
    prevSelectedModuleRef,
    quickActionItems,
    refreshing,
    requisitionDetail,
    requisitionHasMore,
    requisitionItems,
    requisitionPage,
    requisitionsUpdatedAt,
    resolveNotificationTarget,
    setApprovalDetail,
    setApprovalHasMore,
    setApprovalItems,
    setApprovalNotes,
    setApprovalPage,
    setApprovalStatus,
    setApprovalsUpdatedAt,
    setAttendanceFrom,
    setAttendanceItems,
    setAttendanceUpdatedAt,
    setLeaveDetail,
    setLeaveEnd,
    setLeaveHasMore,
    setLeaveNotes,
    setLeavePage,
    setLeaveRequests,
    setLeaveStart,
    setLeaveTypeId,
    setLeaveTypes,
    setLeaveUpdatedAt,
    setLogisticsDetail,
    setLogisticsHasMore,
    setLogisticsItems,
    setLogisticsPage,
    setLogisticsQueryCommitted,
    setLogisticsSearchInput,
    setLogisticsTotal,
    setLogisticsUpdatedAt,
    setMobileSummary,
    setMobileSummaryError,
    setMobileSummaryUpdatedAt,
    setModuleError,
    setModuleLoading,
    setNotificationHasMore,
    setNotificationPage,
    setNotificationUnreadCount,
    setNotifications,
    setNotificationsUpdatedAt,
    setPartDetail,
    setPartHasMore,
    setPartItems,
    setPartListTotal,
    setPartPage,
    setPartQueryCommitted,
    setPartSearchInput,
    setPartsUpdatedAt,
    setPayrollError,
    setPayrollLoading,
    setPayslipDetail,
    setPayslipItems,
    setPayslipsUpdatedAt,
    setPurchaseOrderDetail,
    setRefreshing,
    setRequisitionDetail,
    setRequisitionHasMore,
    setRequisitionItems,
    setRequisitionPage,
    setRequisitionsUpdatedAt,
    setShowSupportComposer,
    setStockHasMore,
    setStockLineQueryCommitted,
    setStockLines,
    setStockLinesUpdatedAt,
    setStockPage,
    setStockSearchInput,
    setStockStoreId,
    setStockStores,
    setStockStoresUpdatedAt,
    setStoreMovementKind,
    setSummaryLoading,
    setSupportDetail,
    setSupportNewBody,
    setSupportNewCategory,
    setSupportNewSubject,
    setSupportReply,
    setSupportTickets,
    setSupportUpdatedAt,
    setSupplierDetail,
    setSupplierHasMore,
    setSupplierItems,
    setSupplierPage,
    setSupplierQueryCommitted,
    setSupplierSearchInput,
    setSuppliersUpdatedAt,
    setUnitDetail,
    setUnitHasMore,
    setUnitItems,
    setUnitPage,
    setUnitQueryCommitted,
    setUnitSearchInput,
    setUnitsUpdatedAt,
    setCategoryDetail,
    setCategoryHasMore,
    setCategoryItems,
    setCategoryPage,
    setCategoryQueryCommitted,
    setCategorySearchInput,
    setCategoriesUpdatedAt,
    setBankMasterDetail,
    setBankMasterHasMore,
    setBankMasterItems,
    setBankMasterPage,
    setBankMasterQueryCommitted,
    setBankMasterSearchInput,
    setBanksUpdatedAt,
    setBankBranchDetail,
    setBankBranchHasMore,
    setBankBranchItems,
    setBankBranchPage,
    setBankBranchQueryCommitted,
    setBankBranchSearchInput,
    setBankBranchesUpdatedAt,
    setMobileOperatorDetail,
    setMobileOperatorHasMore,
    setMobileOperatorItems,
    setMobileOperatorPage,
    setMobileOperatorQueryCommitted,
    setMobileOperatorSearchInput,
    setMobileOperatorsUpdatedAt,
    showSupportComposer,
    stockHasMore,
    stockLineQueryCommitted,
    stockLines,
    stockLinesFetchSeqRef,
    stockLinesUpdatedAt,
    stockPage,
    stockSearchInput,
    stockStoreId,
    stockStores,
    stockStoresFetchSeqRef,
    stockStoresUpdatedAt,
    supplierDetail,
    supplierHasMore,
    supplierItems,
    supplierPage,
    supplierQueryCommitted,
    supplierSearchInput,
    suppliersUpdatedAt,
    unitItems,
    unitPage,
    unitHasMore,
    unitsUpdatedAt,
    unitDetail,
    unitSearchInput,
    unitQueryCommitted,
    categoryItems,
    categoryPage,
    categoryHasMore,
    categoriesUpdatedAt,
    categoryDetail,
    categorySearchInput,
    categoryQueryCommitted,
    bankMasterItems,
    bankMasterPage,
    bankMasterHasMore,
    banksUpdatedAt,
    bankMasterDetail,
    bankMasterSearchInput,
    bankMasterQueryCommitted,
    bankBranchItems,
    bankBranchPage,
    bankBranchHasMore,
    bankBranchesUpdatedAt,
    bankBranchDetail,
    bankBranchSearchInput,
    bankBranchQueryCommitted,
    mobileOperatorItems,
    mobileOperatorPage,
    mobileOperatorHasMore,
    mobileOperatorsUpdatedAt,
    mobileOperatorDetail,
    mobileOperatorSearchInput,
    mobileOperatorQueryCommitted,
    storeMovementKind,
    submitLeaveRequest,
    submitNewSupportTicket,
    submitSupportReply,
    summaryLoading,
    supportDetail,
    supportNewBody,
    supportNewCategory,
    supportNewSubject,
    supportReply,
    supportTickets,
    supportUpdatedAt,
  } = sp;

  return (
            <View style={styles.card}>
              {selectedModule === 'Approvals' ? (
              <View style={styles.approvalsSection}>
                <Text style={styles.approvalsTitle}>Approvals Inbox</Text>
                <Text style={styles.syncText}>
                  Last updated: {approvalsUpdatedAt ?? 'Not synced yet'}
                </Text>
                {moduleError ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Could not load approvals</Text>
                    <Text style={styles.emptyStateText}>{moduleError}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadApprovals(1, { force: true })}>
                      <Text style={styles.detailsButtonText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}
                {!moduleError && !moduleLoading && approvalItems.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No pending approvals</Text>
                    <Text style={styles.emptyStateText}>You are all caught up.</Text>
                  </View>
                ) : null}
                {approvalItems.map((item) => (
                  <View key={item.id} style={styles.approvalCard}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{item.id}</Text>
                      <Text style={styles.approvalStatus}>{item.status}</Text>
                    </View>
                    <Text style={styles.approvalType}>{item.type}</Text>
                    <Text style={styles.approvalSubject}>{item.subject}</Text>
                    <Text style={styles.approvalOwner}>Requested by {item.owner}</Text>
                    <TextInput
                      style={styles.approvalNoteInput}
                      placeholder="Optional action note"
                      placeholderTextColor="#96a2b8"
                      multiline
                      value={approvalNotes[item.id] ?? ''}
                      onChangeText={(value) =>
                        setApprovalNotes((current) => ({
                          ...current,
                          [item.id]: value,
                        }))
                      }
                    />

                    <View style={styles.approvalActions}>
                      <Pressable
                        style={styles.approveButton}
                        onPress={() => void setApprovalStatus(item.id, 'Approved')}
                      >
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </Pressable>
                      <Pressable
                        style={styles.rejectButton}
                        onPress={() => void setApprovalStatus(item.id, 'Rejected')}
                      >
                        <Text style={styles.rejectButtonText}>Reject</Text>
                      </Pressable>
                      <Pressable
                        style={styles.detailsButton}
                        onPress={() => void loadApprovalDetail(item.id)}
                      >
                        <Text style={styles.detailsButtonText}>Details</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
                {approvalDetail ? (
                  <View style={styles.approvalDetailCard}>
                    <Text style={styles.approvalsTitle}>Approval Details</Text>
                    <Text style={styles.meta}>Ref: {approvalDetail.ref}</Text>
                    <Text style={styles.meta}>Owner: {approvalDetail.owner}</Text>
                    <Text style={styles.meta}>Subject: {approvalDetail.subject}</Text>
                    <Text style={styles.meta}>Requested: {approvalDetail.requested_date || '-'}</Text>
                    <Text style={styles.meta}>Priority: {approvalDetail.priority || '-'}</Text>
                    <Text style={styles.meta}>Decision note: {approvalDetail.approval_comment || '-'}</Text>
                    <Text style={styles.approvalsTitle}>Lines</Text>
                    {approvalDetail.lines.length === 0 ? (
                      <Text style={styles.emptyStateText}>No line items found.</Text>
                    ) : (
                      approvalDetail.lines.map((line) => (
                        <View key={line.id} style={styles.approvalLineRow}>
                          <Text style={styles.approvalType}>{line.item}</Text>
                          <Text style={styles.approvalOwner}>
                            {line.quantity} {line.unit || ''} {line.category ? `- ${line.category}` : ''}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                ) : null}
                {approvalHasMore ? (
                  <Pressable style={styles.detailsButton} onPress={() => void loadApprovals(approvalPage + 1)}>
                    <Text style={styles.detailsButtonText}>Load more approvals</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {selectedModule === 'Notifications' ? (
              <View style={styles.approvalsSection}>
                <View style={styles.notificationsHeader}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.approvalsTitle}>Notifications</Text>
                    {notificationUnreadCount > 0 ? (
                      <Text style={styles.meta}>{notificationUnreadCount} unread</Text>
                    ) : null}
                  </View>
                  <Pressable style={styles.detailsButton} onPress={() => void markAllRead()}>
                    <Text style={styles.detailsButtonText}>Mark all read</Text>
                  </Pressable>
                </View>
                <Text style={styles.syncText}>
                  Last updated: {notificationsUpdatedAt ?? 'Not synced yet'}
                </Text>
                {moduleError ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Could not load notifications</Text>
                    <Text style={styles.emptyStateText}>{moduleError}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadNotifications(1)}>
                      <Text style={styles.detailsButtonText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}
                {!moduleError && !moduleLoading && notifications.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No notifications</Text>
                    <Text style={styles.emptyStateText}>You have no new notifications.</Text>
                  </View>
                ) : null}
                {notifications.map((item) => (
                  <View key={item.id} style={styles.notificationCard}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{item.id}</Text>
                      <Text style={[styles.notificationState, item.read ? styles.notificationRead : styles.notificationUnread]}>
                        {item.read ? 'Read' : 'Unread'}
                      </Text>
                    </View>
                    <Text style={styles.approvalType}>{item.title}</Text>
                    <Text style={styles.approvalOwner}>{item.body}</Text>
                    <View style={styles.approvalActions}>
                      {!item.read ? (
                        <Pressable style={styles.approveButton} onPress={() => void markOneNotificationRead(item.id)}>
                          <Text style={styles.approveButtonText}>Mark as read</Text>
                        </Pressable>
                      ) : null}
                      <Pressable style={styles.detailsButton} onPress={() => void openNotificationTarget(item)}>
                        <Text style={styles.detailsButtonText}>Open</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
                {notificationHasMore ? (
                  <Pressable style={styles.detailsButton} onPress={() => void loadNotifications(notificationPage + 1)}>
                    <Text style={styles.detailsButtonText}>Load more notifications</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {selectedModule === 'Leave Requests' ? (
              <View style={styles.approvalsSection}>
                <Text style={styles.approvalsTitle}>Leave Requests</Text>
                <Text style={styles.syncText}>Last updated: {leaveUpdatedAt ?? 'Not synced yet'}</Text>

                <View style={styles.leaveFormCard}>
                  <Text style={styles.approvalType}>New Request</Text>
                  <Text style={styles.approvalOwner}>Leave type</Text>
                  <View style={styles.leaveTypeWrap}>
                    {leaveTypes.length === 0 ? (
                      <Text style={styles.emptyStateText}>No leave types configured.</Text>
                    ) : (
                      leaveTypes.map((type) => (
                        <Pressable
                          key={type.id}
                          style={[styles.leaveTypeChip, leaveTypeId === type.id ? styles.leaveTypeChipActive : null]}
                          onPress={() => setLeaveTypeId(type.id)}
                        >
                          <Text style={styles.menuChipText}>{type.name}</Text>
                        </Pressable>
                      ))
                    )}
                  </View>
                  <DatePickerField label="Start date" value={leaveStart} onChange={setLeaveStart} marginTop={10} />
                  <DatePickerField label="End date" value={leaveEnd} onChange={setLeaveEnd} marginTop={8} />
                  <TextInput
                    style={styles.approvalNoteInput}
                    placeholder="Reason / notes"
                    placeholderTextColor="#96a2b8"
                    multiline
                    value={leaveNotes}
                    onChangeText={setLeaveNotes}
                  />
                  <Pressable style={styles.primaryAction} onPress={() => void submitLeaveRequest()}>
                    <Text style={styles.primaryActionText}>Submit Leave Request</Text>
                  </Pressable>
                </View>

                {moduleError ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Could not load leave requests</Text>
                    <Text style={styles.emptyStateText}>{moduleError}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadLeaveRequests(1)}>
                      <Text style={styles.detailsButtonText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}

                {!moduleError && !moduleLoading && leaveRequests.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No leave requests yet</Text>
                    <Text style={styles.emptyStateText}>Submit your first leave request above.</Text>
                  </View>
                ) : null}

                {leaveRequests.map((item) => (
                  <Pressable key={item.id} style={styles.approvalCard} onPress={() => void loadLeaveRequestDetail(item.id)}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{item.id}</Text>
                      <Text style={styles.approvalStatus}>{item.status}</Text>
                    </View>
                    <Text style={styles.approvalType}>{item.leave_type}</Text>
                    <Text style={styles.approvalOwner}>
                      {item.date_start || '-'} to {item.date_end || '-'} {item.days_requested ? `(${item.days_requested} days)` : ''}
                    </Text>
                    <Text style={styles.approvalOwner}>{item.notes || '-'}</Text>
                    <Text style={styles.meta}>Tap for details</Text>
                  </Pressable>
                ))}

                {leaveDetail ? (
                  <View style={styles.approvalDetailCard}>
                    <Text style={styles.approvalsTitle}>Leave request detail</Text>
                    <Text style={styles.meta}>Ref: {leaveDetail.id}</Text>
                    <Text style={styles.meta}>Type: {leaveDetail.leave_type}</Text>
                    <Text style={styles.meta}>Status: {leaveDetail.status}</Text>
                    <Text style={styles.meta}>
                      Dates: {leaveDetail.date_start ?? '—'} → {leaveDetail.date_end ?? '—'}
                    </Text>
                    {leaveDetail.days_requested != null ? (
                      <Text style={styles.meta}>Days: {leaveDetail.days_requested}</Text>
                    ) : null}
                    {leaveDetail.reason ? <Text style={styles.moduleBody}>Reason: {leaveDetail.reason}</Text> : null}
                    {leaveDetail.notes ? <Text style={styles.moduleBody}>Notes: {leaveDetail.notes}</Text> : null}
                    {leaveDetail.manager_approved_at ? (
                      <Text style={styles.meta}>Manager approved: {leaveDetail.manager_approved_at}</Text>
                    ) : null}
                    {leaveDetail.approved_at ? (
                      <Text style={styles.meta}>Approved: {leaveDetail.approved_at}</Text>
                    ) : null}
                    {leaveDetail.created_at ? <Text style={styles.meta}>Created: {leaveDetail.created_at}</Text> : null}
                    <Pressable style={styles.detailsButton} onPress={() => setLeaveDetail(null)}>
                      <Text style={styles.detailsButtonText}>Close</Text>
                    </Pressable>
                  </View>
                ) : null}

                {leaveHasMore ? (
                  <Pressable style={styles.detailsButton} onPress={() => void loadLeaveRequests(leavePage + 1)}>
                    <Text style={styles.detailsButtonText}>Load more leave requests</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {selectedModule === 'Requisitions' ? (
              <View style={styles.approvalsSection}>
                <Text style={styles.approvalsTitle}>Requisitions</Text>
                <Text style={styles.syncText}>Last updated: {requisitionsUpdatedAt ?? 'Not synced yet'}</Text>
                {!canViewMobileRequisitions ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Requisitions not available</Text>
                    <Text style={styles.emptyStateText}>You do not have permission to view requisitions.</Text>
                  </View>
                ) : null}
                {moduleError ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Could not load requisitions</Text>
                    <Text style={styles.emptyStateText}>{moduleError}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadRequisitions(1)}>
                      <Text style={styles.detailsButtonText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}
                {canViewMobileRequisitions && !moduleError && !moduleLoading && requisitionItems.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No requisitions</Text>
                    <Text style={styles.emptyStateText}>Create requisitions in the web ERP.</Text>
                  </View>
                ) : null}
                {canViewMobileRequisitions
                  ? requisitionItems.map((item) => (
                      <View key={item.id} style={styles.approvalCard}>
                        <View style={styles.approvalHeader}>
                          <Text style={styles.approvalId}>{item.ref}</Text>
                          <Text style={styles.approvalStatus}>{item.status_label}</Text>
                        </View>
                        <Text style={styles.approvalSubject}>{item.description || '—'}</Text>
                        <Text style={styles.approvalOwner}>
                          {item.requested_date ?? '—'} · {item.site} / {item.store}
                        </Text>
                        <Pressable
                          style={styles.detailsButton}
                          onPress={() => {
                            setPurchaseOrderDetail(null);
                            void loadRequisitionDetail(item.id);
                          }}
                        >
                          <Text style={styles.detailsButtonText}>Details</Text>
                        </Pressable>
                      </View>
                    ))
                  : null}
                {canViewMobileRequisitions && requisitionHasMore ? (
                  <Pressable style={styles.detailsButton} onPress={() => void loadRequisitions(requisitionPage + 1)}>
                    <Text style={styles.detailsButtonText}>Load more</Text>
                  </Pressable>
                ) : null}
                {requisitionDetail ? (
                  <View style={styles.approvalDetailCard}>
                    <Text style={styles.approvalsTitle}>Requisition details</Text>
                    <Text style={styles.meta}>Ref: {requisitionDetail.ref}</Text>
                    <Text style={styles.meta}>Status: {requisitionDetail.status_label}</Text>
                    <Text style={styles.meta}>Requested: {requisitionDetail.requested_date ?? '—'}</Text>
                    <Text style={styles.meta}>Comment: {requisitionDetail.approval_comment ?? '—'}</Text>
                    <Text style={styles.approvalsTitle}>Lines</Text>
                    {requisitionDetail.lines.length === 0 ? (
                      <Text style={styles.emptyStateText}>No line items.</Text>
                    ) : (
                      requisitionDetail.lines.map((line) => (
                        <View key={line.id} style={styles.approvalLineRow}>
                          <Text style={styles.approvalType}>{line.item}</Text>
                          <Text style={styles.approvalOwner}>
                            {line.quantity} {line.unit || ''} {line.category ? `· ${line.category}` : ''}
                          </Text>
                        </View>
                      ))
                    )}
                    <Pressable style={styles.detailsButton} onPress={() => setRequisitionDetail(null)}>
                      <Text style={styles.detailsButtonText}>Close</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            {selectedModule === 'Purchase orders' ? (
              <View style={styles.approvalsSection}>
                <Text style={styles.approvalsTitle}>Purchase orders</Text>
                <Text style={styles.syncText}>Last updated: {purchaseOrdersUpdatedAt ?? 'Not synced yet'}</Text>
                {!canViewMobilePurchaseOrders ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Purchase orders not available</Text>
                    <Text style={styles.emptyStateText}>You do not have permission to view purchase orders.</Text>
                  </View>
                ) : null}
                {moduleError ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Could not load purchase orders</Text>
                    <Text style={styles.emptyStateText}>{moduleError}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadPurchaseOrders(1)}>
                      <Text style={styles.detailsButtonText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}
                {canViewMobilePurchaseOrders && !moduleError && !moduleLoading && purchaseOrderItems.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No purchase orders</Text>
                    <Text style={styles.emptyStateText}>Purchase orders you can access will appear here.</Text>
                  </View>
                ) : null}
                {canViewMobilePurchaseOrders
                  ? purchaseOrderItems.map((item) => {
                      const total = item.total_display ?? item.total_incl_vat;
                      const totalLabel =
                        total != null && !Number.isNaN(Number(total))
                          ? Number(total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : '—';
                      return (
                        <View key={item.id} style={styles.approvalCard}>
                          <View style={styles.approvalHeader}>
                            <Text style={styles.approvalId}>{item.ref}</Text>
                            <Text style={styles.approvalStatus}>{item.status_label}</Text>
                          </View>
                          <Text style={styles.approvalSubject} numberOfLines={2}>
                            {item.supplier_name || item.description || '—'}
                          </Text>
                          <Text style={styles.approvalOwner}>
                            {item.order_date ?? '—'}
                            {item.requisition_ref ? ` · Req ${item.requisition_ref}` : ''}
                          </Text>
                          <Text style={styles.meta}>Total (incl. VAT): {totalLabel}</Text>
                          <Pressable
                            style={styles.detailsButton}
                            onPress={() => {
                              setRequisitionDetail(null);
                              void loadPurchaseOrderDetail(item.id);
                            }}
                          >
                            <Text style={styles.detailsButtonText}>Details</Text>
                          </Pressable>
                        </View>
                      );
                    })
                  : null}
                {canViewMobilePurchaseOrders && purchaseOrderHasMore ? (
                  <Pressable style={styles.detailsButton} onPress={() => void loadPurchaseOrders(purchaseOrderPage + 1)}>
                    <Text style={styles.detailsButtonText}>Load more</Text>
                  </Pressable>
                ) : null}
                {purchaseOrderDetail ? (
                  <View style={styles.approvalDetailCard}>
                    <Text style={styles.approvalsTitle}>Purchase order details</Text>
                    <Text style={styles.meta}>Ref: {purchaseOrderDetail.ref}</Text>
                    <Text style={styles.meta}>Status: {purchaseOrderDetail.status_label}</Text>
                    <Text style={styles.meta}>Supplier: {purchaseOrderDetail.supplier_name || '—'}</Text>
                    <Text style={styles.meta}>Order date: {purchaseOrderDetail.order_date ?? '—'}</Text>
                    <Text style={styles.meta}>Due: {purchaseOrderDetail.order_due_date ?? '—'}</Text>
                    <Text style={styles.meta}>Approved: {purchaseOrderDetail.approved_date ?? '—'}</Text>
                    <Text style={styles.approvalsTitle}>Lines</Text>
                    {purchaseOrderDetail.lines.length === 0 ? (
                      <Text style={styles.emptyStateText}>No line items.</Text>
                    ) : (
                      purchaseOrderDetail.lines.map((line) => (
                        <View key={line.id} style={styles.approvalLineRow}>
                          <Text style={styles.approvalType}>{line.item}</Text>
                          <Text style={styles.approvalOwner}>
                            {line.quantity} {line.unit || ''}
                            {line.category ? ` · ${line.category}` : ''}
                            {line.line_total != null
                              ? ` · ${Number(line.line_total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : ''}
                          </Text>
                        </View>
                      ))
                    )}
                    <Pressable style={styles.detailsButton} onPress={() => setPurchaseOrderDetail(null)}>
                      <Text style={styles.detailsButtonText}>Close</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            {selectedModule === 'Suppliers' ? (
              <View style={styles.approvalsSection}>
                <Text style={styles.approvalsTitle}>Suppliers</Text>
                <Text style={styles.syncText}>Last updated: {suppliersUpdatedAt ?? 'Not synced yet'}</Text>
                <ModuleSearchToolbar
                  value={supplierSearchInput}
                  onChangeText={setSupplierSearchInput}
                  onSearch={() => void loadSuppliers(1, supplierSearchInput.trim())}
                  onClear={() => {
                    setSupplierSearchInput('');
                    void loadSuppliers(1, '');
                  }}
                  placeholder="Search name, code, phone, or email"
                />
                {moduleError ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Could not load suppliers</Text>
                    <Text style={styles.emptyStateText}>{moduleError}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadSuppliers(1, supplierQueryCommitted)}>
                      <Text style={styles.detailsButtonText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}
                {!moduleError && !moduleLoading && supplierItems.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No suppliers</Text>
                  </View>
                ) : null}
                {supplierItems.map((item) => (
                  <View key={item.id} style={styles.approvalCard}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{item.code || item.name}</Text>
                      <Text style={styles.approvalStatus}>{item.status}</Text>
                    </View>
                    <Text style={styles.approvalSubject} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.approvalOwner}>
                      {item.phone || '—'}
                      {item.email ? ` · ${item.email}` : ''}
                    </Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadSupplierDetail(item.id)}>
                      <Text style={styles.detailsButtonText}>Details</Text>
                    </Pressable>
                  </View>
                ))}
                {supplierHasMore ? (
                  <Pressable style={styles.detailsButton} onPress={() => void loadSuppliers(supplierPage + 1)}>
                    <Text style={styles.detailsButtonText}>Load more</Text>
                  </Pressable>
                ) : null}
                {supplierDetail ? (
                  <View style={styles.approvalDetailCard}>
                    <Text style={styles.approvalsTitle}>Supplier details</Text>
                    <Text style={styles.meta}>Code: {supplierDetail.code || '—'}</Text>
                    <Text style={styles.meta}>Name: {supplierDetail.name}</Text>
                    <Text style={styles.meta}>Status: {supplierDetail.status}</Text>
                    <Text style={styles.meta}>Phone: {supplierDetail.phone || '—'}</Text>
                    <Text style={styles.meta}>Email: {supplierDetail.email || '—'}</Text>
                    <Text style={styles.moduleBody}>{supplierDetail.address || '—'}</Text>
                    <Text style={styles.meta}>Payment type: {supplierDetail.payment_type || '—'}</Text>
                    <Text style={styles.meta}>Account: {supplierDetail.account_no || '—'}</Text>
                    <Text style={styles.meta}>Provider: {supplierDetail.account_provider || '—'}</Text>
                    {supplierDetail.currency ? <Text style={styles.meta}>Currency: {supplierDetail.currency}</Text> : null}
                    <Pressable style={styles.detailsButton} onPress={() => setSupplierDetail(null)}>
                      <Text style={styles.detailsButtonText}>Close</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            {selectedModule === 'Units' ? (
              <View style={styles.approvalsSection}>
                <Text style={styles.approvalsTitle}>Units of measurement</Text>
                <Text style={styles.syncText}>Last updated: {unitsUpdatedAt ?? 'Not synced yet'}</Text>
                <ModuleSearchToolbar
                  value={unitSearchInput}
                  onChangeText={setUnitSearchInput}
                  onSearch={() => void loadUnits(1, unitSearchInput.trim())}
                  onClear={() => {
                    setUnitSearchInput('');
                    void loadUnits(1, '');
                  }}
                  placeholder="Search UOM or description"
                />
                {moduleError ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Could not load units</Text>
                    <Text style={styles.emptyStateText}>{moduleError}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadUnits(1, unitQueryCommitted)}>
                      <Text style={styles.detailsButtonText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}
                {!moduleError && !moduleLoading && unitItems.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No units</Text>
                  </View>
                ) : null}
                {unitItems.map((item) => (
                  <View key={item.id} style={styles.approvalCard}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{item.uom}</Text>
                      <Text style={styles.approvalStatus}>{item.status}</Text>
                    </View>
                    <Text style={styles.approvalSubject} numberOfLines={2}>
                      {item.description || '—'}
                    </Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadUnitDetail(item.id)}>
                      <Text style={styles.detailsButtonText}>Details</Text>
                    </Pressable>
                  </View>
                ))}
                {unitHasMore ? (
                  <Pressable style={styles.detailsButton} onPress={() => void loadUnits(unitPage + 1)}>
                    <Text style={styles.detailsButtonText}>Load more</Text>
                  </Pressable>
                ) : null}
                {unitDetail ? (
                  <View style={styles.approvalDetailCard}>
                    <Text style={styles.approvalsTitle}>Unit details</Text>
                    <Text style={styles.meta}>UOM: {unitDetail.uom}</Text>
                    <Text style={styles.meta}>Status: {unitDetail.status}</Text>
                    <Text style={styles.moduleBody}>{unitDetail.description || '—'}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => setUnitDetail(null)}>
                      <Text style={styles.detailsButtonText}>Close</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            {selectedModule === 'Categories' ? (
              <View style={styles.approvalsSection}>
                <Text style={styles.approvalsTitle}>Categories</Text>
                <Text style={styles.syncText}>Last updated: {categoriesUpdatedAt ?? 'Not synced yet'}</Text>
                <ModuleSearchToolbar
                  value={categorySearchInput}
                  onChangeText={setCategorySearchInput}
                  onSearch={() => void loadCategories(1, categorySearchInput.trim())}
                  onClear={() => {
                    setCategorySearchInput('');
                    void loadCategories(1, '');
                  }}
                  placeholder="Search category name"
                />
                {moduleError ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Could not load categories</Text>
                    <Text style={styles.emptyStateText}>{moduleError}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadCategories(1, categoryQueryCommitted)}>
                      <Text style={styles.detailsButtonText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}
                {!moduleError && !moduleLoading && categoryItems.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No categories</Text>
                  </View>
                ) : null}
                {categoryItems.map((item) => (
                  <View key={item.id} style={styles.approvalCard}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{item.name}</Text>
                      <Text style={styles.approvalStatus}>{item.status}</Text>
                    </View>
                    <Pressable style={styles.detailsButton} onPress={() => void loadCategoryDetail(item.id)}>
                      <Text style={styles.detailsButtonText}>Details</Text>
                    </Pressable>
                  </View>
                ))}
                {categoryHasMore ? (
                  <Pressable style={styles.detailsButton} onPress={() => void loadCategories(categoryPage + 1)}>
                    <Text style={styles.detailsButtonText}>Load more</Text>
                  </Pressable>
                ) : null}
                {categoryDetail ? (
                  <View style={styles.approvalDetailCard}>
                    <Text style={styles.approvalsTitle}>Category details</Text>
                    <Text style={styles.meta}>Name: {categoryDetail.name}</Text>
                    <Text style={styles.meta}>Status: {categoryDetail.status}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => setCategoryDetail(null)}>
                      <Text style={styles.detailsButtonText}>Close</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            {selectedModule === 'Banks' ? (
              <View style={styles.approvalsSection}>
                <Text style={styles.approvalsTitle}>Banks</Text>
                <Text style={styles.syncText}>Last updated: {banksUpdatedAt ?? 'Not synced yet'}</Text>
                <ModuleSearchToolbar
                  value={bankMasterSearchInput}
                  onChangeText={setBankMasterSearchInput}
                  onSearch={() => void loadBanks(1, bankMasterSearchInput.trim())}
                  onClear={() => {
                    setBankMasterSearchInput('');
                    void loadBanks(1, '');
                  }}
                  placeholder="Search bank name or code"
                />
                {moduleError ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Could not load banks</Text>
                    <Text style={styles.emptyStateText}>{moduleError}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadBanks(1, bankMasterQueryCommitted)}>
                      <Text style={styles.detailsButtonText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}
                {!moduleError && !moduleLoading && bankMasterItems.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No banks</Text>
                  </View>
                ) : null}
                {bankMasterItems.map((item) => (
                  <View key={item.id} style={styles.approvalCard}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{item.bank_code || item.bank_name}</Text>
                      <Text style={styles.approvalStatus}>{item.status}</Text>
                    </View>
                    <Text style={styles.approvalSubject} numberOfLines={2}>
                      {item.bank_name}
                    </Text>
                    <Text style={styles.approvalOwner}>SWIFT: {item.swift_code || '—'}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadBankMasterDetail(item.id)}>
                      <Text style={styles.detailsButtonText}>Details</Text>
                    </Pressable>
                  </View>
                ))}
                {bankMasterHasMore ? (
                  <Pressable style={styles.detailsButton} onPress={() => void loadBanks(bankMasterPage + 1)}>
                    <Text style={styles.detailsButtonText}>Load more</Text>
                  </Pressable>
                ) : null}
                {bankMasterDetail ? (
                  <View style={styles.approvalDetailCard}>
                    <Text style={styles.approvalsTitle}>Bank details</Text>
                    <Text style={styles.meta}>Name: {bankMasterDetail.bank_name}</Text>
                    <Text style={styles.meta}>Code: {bankMasterDetail.bank_code || '—'}</Text>
                    <Text style={styles.meta}>SWIFT: {bankMasterDetail.swift_code || '—'}</Text>
                    <Text style={styles.meta}>Status: {bankMasterDetail.status}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => setBankMasterDetail(null)}>
                      <Text style={styles.detailsButtonText}>Close</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            {selectedModule === 'Bank branches' ? (
              <View style={styles.approvalsSection}>
                <Text style={styles.approvalsTitle}>Bank branches</Text>
                <Text style={styles.syncText}>Last updated: {bankBranchesUpdatedAt ?? 'Not synced yet'}</Text>
                <ModuleSearchToolbar
                  value={bankBranchSearchInput}
                  onChangeText={setBankBranchSearchInput}
                  onSearch={() => void loadBankBranches(1, bankBranchSearchInput.trim())}
                  onClear={() => {
                    setBankBranchSearchInput('');
                    void loadBankBranches(1, '');
                  }}
                  placeholder="Search branch or bank"
                />
                {moduleError ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Could not load bank branches</Text>
                    <Text style={styles.emptyStateText}>{moduleError}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadBankBranches(1, bankBranchQueryCommitted)}>
                      <Text style={styles.detailsButtonText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}
                {!moduleError && !moduleLoading && bankBranchItems.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No bank branches</Text>
                  </View>
                ) : null}
                {bankBranchItems.map((item) => (
                  <View key={item.id} style={styles.approvalCard}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{item.branch_code || item.branch_name}</Text>
                      <Text style={styles.approvalStatus}>{item.status}</Text>
                    </View>
                    <Text style={styles.approvalSubject} numberOfLines={2}>
                      {item.branch_name}
                    </Text>
                    <Text style={styles.approvalOwner}>{item.bank_label || '—'}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadBankBranchDetail(item.id)}>
                      <Text style={styles.detailsButtonText}>Details</Text>
                    </Pressable>
                  </View>
                ))}
                {bankBranchHasMore ? (
                  <Pressable style={styles.detailsButton} onPress={() => void loadBankBranches(bankBranchPage + 1)}>
                    <Text style={styles.detailsButtonText}>Load more</Text>
                  </Pressable>
                ) : null}
                {bankBranchDetail ? (
                  <View style={styles.approvalDetailCard}>
                    <Text style={styles.approvalsTitle}>Branch details</Text>
                    <Text style={styles.meta}>Branch: {bankBranchDetail.branch_name}</Text>
                    <Text style={styles.meta}>Branch code: {bankBranchDetail.branch_code || '—'}</Text>
                    <Text style={styles.meta}>Bank: {bankBranchDetail.bank_name}</Text>
                    <Text style={styles.meta}>Bank code: {bankBranchDetail.bank_code || '—'}</Text>
                    <Text style={styles.meta}>SWIFT: {bankBranchDetail.swift_code || '—'}</Text>
                    <Text style={styles.meta}>Status: {bankBranchDetail.status}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => setBankBranchDetail(null)}>
                      <Text style={styles.detailsButtonText}>Close</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            {selectedModule === 'Mobile operators' ? (
              <View style={styles.approvalsSection}>
                <Text style={styles.approvalsTitle}>Mobile operators</Text>
                <Text style={styles.syncText}>Last updated: {mobileOperatorsUpdatedAt ?? 'Not synced yet'}</Text>
                <ModuleSearchToolbar
                  value={mobileOperatorSearchInput}
                  onChangeText={setMobileOperatorSearchInput}
                  onSearch={() => void loadMobileOperators(1, mobileOperatorSearchInput.trim())}
                  onClear={() => {
                    setMobileOperatorSearchInput('');
                    void loadMobileOperators(1, '');
                  }}
                  placeholder="Search operator name or code"
                />
                {moduleError ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Could not load mobile operators</Text>
                    <Text style={styles.emptyStateText}>{moduleError}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadMobileOperators(1, mobileOperatorQueryCommitted)}>
                      <Text style={styles.detailsButtonText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}
                {!moduleError && !moduleLoading && mobileOperatorItems.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No mobile operators</Text>
                  </View>
                ) : null}
                {mobileOperatorItems.map((item) => (
                  <View key={item.id} style={styles.approvalCard}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{item.code || item.name}</Text>
                      <Text style={styles.approvalStatus}>{item.status}</Text>
                    </View>
                    <Text style={styles.approvalSubject} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadMobileOperatorDetail(item.id)}>
                      <Text style={styles.detailsButtonText}>Details</Text>
                    </Pressable>
                  </View>
                ))}
                {mobileOperatorHasMore ? (
                  <Pressable style={styles.detailsButton} onPress={() => void loadMobileOperators(mobileOperatorPage + 1)}>
                    <Text style={styles.detailsButtonText}>Load more</Text>
                  </Pressable>
                ) : null}
                {mobileOperatorDetail ? (
                  <View style={styles.approvalDetailCard}>
                    <Text style={styles.approvalsTitle}>Operator details</Text>
                    <Text style={styles.meta}>Name: {mobileOperatorDetail.name}</Text>
                    <Text style={styles.meta}>Code: {mobileOperatorDetail.code || '—'}</Text>
                    <Text style={styles.meta}>Status: {mobileOperatorDetail.status}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => setMobileOperatorDetail(null)}>
                      <Text style={styles.detailsButtonText}>Close</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            {selectedModule === 'Attendance' ? (
              <View style={styles.approvalsSection}>
                <Text style={styles.approvalsTitle}>Attendance</Text>
                <Text style={styles.syncText}>
                  Last updated: {attendanceUpdatedAt ?? 'Not synced yet'}
                  {attendanceFrom ? ` · From ${attendanceFrom}` : ''}
                </Text>
                {moduleError ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Could not load attendance</Text>
                    <Text style={styles.emptyStateText}>{moduleError}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadAttendance()}>
                      <Text style={styles.detailsButtonText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}
                {!moduleError && !moduleLoading && attendanceItems.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No attendance rows</Text>
                    <Text style={styles.emptyStateText}>No records in the selected window.</Text>
                  </View>
                ) : null}
                {attendanceItems.map((row) => (
                  <View key={row.id} style={styles.approvalCard}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{row.date ?? '—'}</Text>
                      <Text style={styles.approvalStatus}>{row.status}</Text>
                    </View>
                    <Text style={styles.approvalOwner}>
                      In {row.check_in ?? '—'} · Out {row.check_out ?? '—'} · Hours {row.hours_worked ?? '—'} · OT{' '}
                      {row.overtime_hours.toFixed(2)}
                    </Text>
                    {row.source ? <Text style={styles.meta}>Source: {row.source}</Text> : null}
                  </View>
                ))}
              </View>
            ) : null}

            {selectedModule === 'Support' ? (
              <View style={styles.approvalsSection}>
                <View style={styles.notificationsHeader}>
                  <Text style={styles.approvalsTitle}>Support</Text>
                  <Pressable style={styles.detailsButton} onPress={() => setShowSupportComposer((v) => !v)}>
                    <Text style={styles.detailsButtonText}>{showSupportComposer ? 'Hide form' : 'New ticket'}</Text>
                  </Pressable>
                </View>
                <Text style={styles.syncText}>Last updated: {supportUpdatedAt ?? 'Not synced yet'}</Text>

                {showSupportComposer ? (
                  <View style={styles.leaveFormCard}>
                    <Text style={styles.approvalType}>New ticket</Text>
                    <View style={styles.leaveTypeWrap}>
                      {(
                        [
                          ['support_request', 'Support'],
                          ['bug_report', 'Bug'],
                          ['other', 'Other'],
                        ] as const
                      ).map(([key, label]) => (
                        <Pressable
                          key={key}
                          style={[
                            styles.leaveTypeChip,
                            supportNewCategory === key ? styles.leaveTypeChipActive : null,
                          ]}
                          onPress={() => setSupportNewCategory(key)}
                        >
                          <Text style={styles.menuChipText}>{label}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <TextInput
                      style={styles.approvalNoteInput}
                      placeholder="Subject"
                      placeholderTextColor="#96a2b8"
                      value={supportNewSubject}
                      onChangeText={setSupportNewSubject}
                    />
                    <TextInput
                      style={styles.approvalNoteInput}
                      placeholder="Describe the issue"
                      placeholderTextColor="#96a2b8"
                      multiline
                      value={supportNewBody}
                      onChangeText={setSupportNewBody}
                    />
                    <Pressable style={styles.primaryAction} onPress={() => void submitNewSupportTicket()}>
                      <Text style={styles.primaryActionText}>Submit ticket</Text>
                    </Pressable>
                  </View>
                ) : null}

                {moduleError ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Support</Text>
                    <Text style={styles.emptyStateText}>{moduleError}</Text>
                    <Pressable style={styles.detailsButton} onPress={() => void loadSupportTickets()}>
                      <Text style={styles.detailsButtonText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}
                {!moduleError && !moduleLoading && supportTickets.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No tickets</Text>
                    <Text style={styles.emptyStateText}>Open a new ticket with the button above.</Text>
                  </View>
                ) : null}
                {supportTickets.map((t) => (
                  <Pressable key={t.id} style={styles.approvalCard} onPress={() => void loadSupportDetail(t.id)}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{t.ticket_number || `#${t.id}`}</Text>
                      <Text style={styles.approvalStatus}>{t.status_label}</Text>
                    </View>
                    <Text style={styles.approvalSubject}>{t.subject}</Text>
                    <Text style={styles.approvalOwner}>{t.category}</Text>
                  </Pressable>
                ))}

                {supportDetail ? (
                  <View style={styles.approvalDetailCard}>
                    <Text style={styles.approvalsTitle}>{supportDetail.ticket_number}</Text>
                    <Text style={styles.meta}>{supportDetail.status_label}</Text>
                    <Text style={styles.moduleBody}>{supportDetail.description}</Text>
                    <Text style={styles.approvalsTitle}>Thread</Text>
                    {supportDetail.messages.length === 0 ? (
                      <Text style={styles.emptyStateText}>No replies yet.</Text>
                    ) : (
                      supportDetail.messages.map((m) => (
                        <View key={m.id} style={styles.notificationCard}>
                          <Text style={styles.approvalOwner}>{m.author}</Text>
                          <Text style={styles.approvalType}>{m.body}</Text>
                          <Text style={styles.meta}>{m.created_at ?? ''}</Text>
                        </View>
                      ))
                    )}
                    <TextInput
                      style={styles.approvalNoteInput}
                      placeholder="Write a reply"
                      placeholderTextColor="#96a2b8"
                      multiline
                      value={supportReply}
                      onChangeText={setSupportReply}
                    />
                    <Pressable
                      style={styles.primaryAction}
                      onPress={() => void submitSupportReply(supportDetail.id)}
                    >
                      <Text style={styles.primaryActionText}>Send reply</Text>
                    </Pressable>
                    {['new', 'pending', 'on_hold'].includes(supportDetail.status) ? (
                      <Pressable style={styles.rejectButton} onPress={() => void cancelOpenedSupportTicket()}>
                        <Text style={styles.rejectButtonText}>Cancel ticket</Text>
                      </Pressable>
                    ) : null}
                    <Pressable style={styles.detailsButton} onPress={() => setSupportDetail(null)}>
                      <Text style={styles.detailsButtonText}>Close</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            {selectedModule === 'Part catalog' ? (
              <View style={styles.approvalsSection}>
                <Text style={styles.sectionTitle}>Part catalog</Text>
                <Text style={styles.syncText}>
                  Quantities reflect your warehouse scope (same as the web ERP). Last updated:{' '}
                  {partsUpdatedAt ?? 'Not synced yet'}
                </Text>
                <ModuleSearchToolbar
                  value={partSearchInput}
                  onChangeText={setPartSearchInput}
                  onSearch={() => void fetchPartsCatalog(1, partSearchInput.trim())}
                  onClear={() => {
                    setPartSearchInput('');
                    void fetchPartsCatalog(1, '');
                  }}
                  placeholder="Code or description"
                />
                {moduleLoading && partItems.length === 0 && !moduleError ? (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <ActivityIndicator color="#1f4f9e" />
                    <Text style={[styles.syncText, { marginTop: 10 }]}>Loading catalog…</Text>
                  </View>
                ) : null}
                {partItems.length > 0 && partListTotal > 0 ? (
                  <Text style={styles.listMetaLine}>
                    Loaded {partItems.length} of {partListTotal} matching parts
                  </Text>
                ) : null}
                {moduleError ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Could not load parts</Text>
                    <Text style={styles.emptyStateText}>{moduleError}</Text>
                    <Pressable style={styles.loadMoreBar} onPress={() => void fetchPartsCatalog(1, partQueryCommitted)}>
                      <Text style={styles.loadMoreBarText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}
                {!moduleError && !moduleLoading && partItems.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No parts in this list</Text>
                    <Text style={styles.emptyStateText}>
                      The API returned zero rows for this search (or your tenant has no parts yet). Try Clear, adjust
                      the filter, or confirm parts exist in the web ERP under Stock → Parts.
                    </Text>
                  </View>
                ) : null}
                {partItems.map((p) => (
                  <Pressable key={p.id} style={styles.stockRowCard} onPress={() => void fetchPartDetail(p.id)}>
                    <View style={styles.stockRowTop}>
                      <Text style={styles.stockRowCode} numberOfLines={1}>
                        {p.code || '—'}
                      </Text>
                      <Text style={styles.stockRowQty}>{p.stock_on_hand.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.stockRowDesc} numberOfLines={3}>
                      {p.description}
                    </Text>
                    <Text style={styles.stockRowMeta}>
                      {p.category} · {p.supplier} · {p.unit} · {p.status}
                    </Text>
                  </Pressable>
                ))}
                {partDetail ? (
                  <View style={styles.approvalDetailCard}>
                    <Text style={styles.sectionTitle}>Part detail</Text>
                    <View style={styles.stockRowTop}>
                      <Text style={styles.stockRowCode} numberOfLines={2}>
                        {partDetail.code}
                      </Text>
                      <Text style={styles.stockRowQty}>{partDetail.stock_on_hand.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.stockRowDesc}>{partDetail.description}</Text>
                    <Text style={styles.stockRowMeta}>
                      {partDetail.category} · {partDetail.supplier} · {partDetail.unit} · {partDetail.status}
                    </Text>
                    <Text style={styles.approvalsTitle}>By store</Text>
                    <View style={styles.stockTableHeader}>
                      <Text style={styles.stockColItem}>Store</Text>
                      <Text style={styles.stockColQty}>Qty</Text>
                    </View>
                    {partDetail.stock_by_store.length === 0 ? (
                      <Text style={styles.emptyStateText}>No stock rows for this part.</Text>
                    ) : (
                      partDetail.stock_by_store.map((row, idx) => (
                        <View key={`${row.store_name}-${idx}`} style={styles.stockRowCard}>
                          <View style={styles.stockRowTop}>
                            <Text style={styles.stockRowCode} numberOfLines={2}>
                              {row.store_name}
                            </Text>
                            <Text style={styles.stockRowQty}>{row.quantity.toFixed(2)}</Text>
                          </View>
                          <Text style={styles.stockRowMeta}>{row.status}</Text>
                        </View>
                      ))
                    )}
                    <Pressable style={styles.loadMoreBar} onPress={() => setPartDetail(null)}>
                      <Text style={styles.loadMoreBarText}>Close detail</Text>
                    </Pressable>
                  </View>
                ) : null}
                {partHasMore ? (
                  <Pressable
                    style={styles.loadMoreBar}
                    onPress={() => void fetchPartsCatalog(partPage + 1, partQueryCommitted)}
                  >
                    <Text style={styles.loadMoreBarText}>Load more parts</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {selectedModule === 'Stock by store' ? (
              <View style={styles.approvalsSection}>
                <Text style={styles.sectionTitle}>Stock by store</Text>
                <Text style={styles.syncText}>
                  Stores: {stockStoresUpdatedAt ?? '—'} · Lines: {stockLinesUpdatedAt ?? '—'}
                </Text>
                {moduleError ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Stock report</Text>
                    <Text style={styles.emptyStateText}>{moduleError}</Text>
                    <Pressable
                      style={styles.loadMoreBar}
                      onPress={() =>
                        stockStoreId
                          ? void fetchStockLines(1, stockStoreId, stockLineQueryCommitted)
                          : void loadStockStores()
                      }
                    >
                      <Text style={styles.loadMoreBarText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}

                <StoreStrip
                  stores={stockStores}
                  selectedId={stockStoreId}
                  onSelect={(id) => {
                    setStockStoreId(id);
                    setStockSearchInput('');
                    void fetchStockLines(1, id, '');
                  }}
                />

                {!stockStoreId ? (
                  <View style={styles.dimPanel}>
                    <Text style={styles.syncText}>
                      Select a warehouse above to load on-hand quantities for that store.
                    </Text>
                    {!moduleLoading && stockStores.length === 0 ? (
                      <Text style={styles.emptyStateText}>No stores are available for your user profile.</Text>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.dimPanel}>
                    <View style={styles.toolbarRow}>
                      <Text style={[styles.approvalOwner, { flex: 1, minWidth: 0 }]} numberOfLines={2}>
                        {stockStores.find((x) => x.id === stockStoreId)?.name ?? `Store ${stockStoreId}`}
                      </Text>
                      <Pressable
                        style={styles.compactSecondaryBtn}
                        onPress={() => {
                          setStockStoreId(null);
                          setStockLines([]);
                          setStockLineQueryCommitted('');
                          setStockSearchInput('');
                        }}
                      >
                        <Text style={styles.compactSecondaryBtnText}>Clear store</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.panelTitle}>Filter lines</Text>
                    <View style={styles.toolbarRow}>
                      <TextInput
                        style={[styles.approvalNoteInput, styles.toolbarInput]}
                        placeholder="Code or description contains…"
                        placeholderTextColor="#96a2b8"
                        value={stockSearchInput}
                        onChangeText={setStockSearchInput}
                        returnKeyType="search"
                        onSubmitEditing={() =>
                          stockStoreId ? void fetchStockLines(1, stockStoreId, stockSearchInput.trim()) : undefined
                        }
                      />
                      <Pressable
                        style={styles.compactPrimaryBtn}
                        onPress={() =>
                          stockStoreId ? void fetchStockLines(1, stockStoreId, stockSearchInput.trim()) : undefined
                        }
                      >
                        <Text style={styles.compactPrimaryBtnText}>Apply</Text>
                      </Pressable>
                    </View>

                    {!moduleLoading && stockLines.length === 0 ? (
                      <Text style={styles.emptyStateText}>No stock lines for this filter.</Text>
                    ) : null}

                    {stockLines.length > 0 ? (
                      <>
                        <View style={styles.stockTableHeader}>
                          <Text style={styles.stockColItem}>Item</Text>
                          <Text style={styles.stockColQty}>Qty</Text>
                        </View>
                        {stockLines.map((row) => (
                          <View key={row.id} style={styles.stockRowCard}>
                            <View style={styles.stockRowTop}>
                              <Text style={styles.stockRowCode} numberOfLines={1}>
                                {row.code || '—'}
                              </Text>
                              <Text style={styles.stockRowQty}>{row.quantity.toFixed(2)}</Text>
                            </View>
                            <Text style={styles.stockRowDesc} numberOfLines={3}>
                              {row.description}
                            </Text>
                            <Text style={styles.stockRowMeta}>
                              {row.category} · {row.supplier} · {row.unit} · Min{' '}
                              {row.min_qty != null ? row.min_qty.toFixed(2) : '—'} · Max{' '}
                              {row.max_qty != null ? row.max_qty.toFixed(2) : '—'} · {row.status}
                            </Text>
                          </View>
                        ))}
                      </>
                    ) : null}

                    {stockHasMore ? (
                      <Pressable
                        style={styles.loadMoreBar}
                        onPress={() =>
                          stockStoreId
                            ? void fetchStockLines(stockPage + 1, stockStoreId, stockLineQueryCommitted)
                            : undefined
                        }
                      >
                        <Text style={styles.loadMoreBarText}>Load more lines</Text>
                      </Pressable>
                    ) : null}
                  </View>
                )}
              </View>
            ) : null}

            {isLogisticsModule(selectedModule) ? (
              <View style={styles.approvalsSection}>
                <Text style={styles.sectionTitle}>{selectedModule}</Text>
                <Text style={styles.syncText}>Last updated: {logisticsUpdatedAt ?? 'Not synced yet'}</Text>
                {selectedModule === 'Store movements' ? (
                  <View style={styles.movementChipRow}>
                    {(
                      [
                        { id: 'k2s', label: 'Kitchen → store' },
                        { id: 's2k', label: 'Store → kitchen' },
                        { id: 'inter_rcpt', label: 'Inter-store receipt' },
                        { id: 'inter_issue', label: 'Inter-store issue' },
                      ] as const
                    ).map((opt) => (
                      <Pressable
                        key={opt.id}
                        style={[
                          styles.menuChip,
                          storeMovementKind === opt.id ? styles.movementChipSelected : null,
                        ]}
                        onPress={() => setStoreMovementKind(opt.id)}
                      >
                        <Text style={styles.menuChipText}>{opt.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                <ModuleSearchToolbar
                  value={logisticsSearchInput}
                  onChangeText={setLogisticsSearchInput}
                  onSearch={() => {
                    const path = logisticsPathFor(selectedModule, storeMovementKind);
                    if (path) void fetchLogisticsDocuments(1, path, logisticsSearchInput.trim());
                  }}
                  onClear={() => {
                    setLogisticsSearchInput('');
                    const path = logisticsPathFor(selectedModule, storeMovementKind);
                    if (path) void fetchLogisticsDocuments(1, path, '');
                  }}
                  placeholder="Search ref or description"
                />
                {moduleLoading && logisticsItems.length === 0 && !moduleError ? (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <ActivityIndicator color="#1f4f9e" />
                    <Text style={[styles.syncText, { marginTop: 10 }]}>Loading…</Text>
                  </View>
                ) : null}
                {logisticsItems.length > 0 && logisticsTotal > 0 ? (
                  <Text style={styles.listMetaLine}>
                    Loaded {logisticsItems.length} of {logisticsTotal} documents
                  </Text>
                ) : null}
                {moduleError ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>Could not load documents</Text>
                    <Text style={styles.emptyStateText}>{moduleError}</Text>
                    <Pressable
                      style={styles.loadMoreBar}
                      onPress={() => {
                        const path = logisticsPathFor(selectedModule, storeMovementKind);
                        if (path) void fetchLogisticsDocuments(1, path, logisticsQueryCommitted);
                      }}
                    >
                      <Text style={styles.loadMoreBarText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}
                {!moduleError && !moduleLoading && logisticsItems.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No documents in this list</Text>
                    <Text style={styles.emptyStateText}>
                      The API returned no rows for this filter. Try Clear or confirm documents exist in the web ERP.
                    </Text>
                  </View>
                ) : null}
                {logisticsItems.map((item) => (
                  <View key={item.id} style={styles.approvalCard}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{item.ref}</Text>
                      <Text style={styles.approvalStatus}>{item.status_label}</Text>
                    </View>
                    <Text style={styles.approvalSubject}>{item.description || '—'}</Text>
                    <Text style={styles.approvalOwner}>
                      {item.document_date ?? '—'}
                      {item.context ? ` · ${item.context}` : ''}
                    </Text>
                    <Pressable
                      style={styles.detailsButton}
                      onPress={() => {
                        const path = logisticsPathFor(selectedModule, storeMovementKind);
                        if (path) void fetchLogisticsDetail(item.id, path);
                      }}
                    >
                      <Text style={styles.detailsButtonText}>Details</Text>
                    </Pressable>
                  </View>
                ))}
                {logisticsDetail ? (
                  <View style={styles.approvalDetailCard}>
                    <Text style={styles.approvalsTitle}>Document detail</Text>
                    <Text style={styles.meta}>Ref: {logisticsDetail.ref}</Text>
                    <Text style={styles.meta}>Status: {logisticsDetail.status_label}</Text>
                    <Text style={styles.meta}>Date: {logisticsDetail.document_date ?? '—'}</Text>
                    {logisticsDetail.context ? <Text style={styles.meta}>{logisticsDetail.context}</Text> : null}
                    <Text style={styles.approvalsTitle}>Lines</Text>
                    {logisticsDetail.lines.length === 0 ? (
                      <Text style={styles.emptyStateText}>No line items.</Text>
                    ) : (
                      logisticsDetail.lines.map((line) => (
                        <View key={line.id} style={styles.approvalLineRow}>
                          <Text style={styles.approvalType}>{line.item}</Text>
                          <Text style={styles.approvalOwner}>
                            {line.quantity.toFixed(2)} {line.unit || ''}
                            {line.note ? ` · ${line.note}` : ''}
                          </Text>
                        </View>
                      ))
                    )}
                    <Pressable style={styles.detailsButton} onPress={() => setLogisticsDetail(null)}>
                      <Text style={styles.detailsButtonText}>Close</Text>
                    </Pressable>
                  </View>
                ) : null}
                {logisticsHasMore ? (
                  <Pressable
                    style={styles.loadMoreBar}
                    onPress={() => {
                      const path = logisticsPathFor(selectedModule, storeMovementKind);
                      if (path) void fetchLogisticsDocuments(logisticsPage + 1, path, logisticsQueryCommitted);
                    }}
                  >
                    <Text style={styles.loadMoreBarText}>Load more</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            </View>
  );
}
