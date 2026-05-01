import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  API_BASE_URL,
  ApprovalDetail,
  ApprovalItem,
  approveItem,
  getApprovalDetail,
  getApprovals,
  createLeaveRequest,
  getLeaveRequests,
  getLeaveTypes,
  LeaveRequestItem,
  LeaveTypeItem,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
  rejectItem,
} from '../api';
import { quickActions, summaryTiles } from '../constants/uiData';
import { styles } from '../styles/appStyles';
import { AppTab, SignedInUser } from '../types/app';

type MainAppScreenProps = {
  token: string;
  user: SignedInUser | null;
  activeTab: AppTab;
  selectedModule: string;
  loading: boolean;
  onSetTab: (tab: AppTab) => void;
  onRefreshProfile: () => void;
  onLogout: () => void;
  onOpenAction: (title: string) => void;
};

export function MainAppScreen({
  token,
  user,
  activeTab,
  selectedModule,
  loading,
  onSetTab,
  onRefreshProfile,
  onLogout,
  onOpenAction,
}: MainAppScreenProps) {
  const insets = useSafeAreaInsets();
  const appBaseUrl = API_BASE_URL.replace('/api/v1', '');
  const logoUri = `${appBaseUrl}/backend/assets/img/logo.png`;
  const menuItems = ['Approvals', 'Leave Requests', 'Requisitions', 'Attendance', 'Notifications'];
  const [moduleLoading, setModuleLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>([]);
  const [approvalDetail, setApprovalDetail] = useState<ApprovalDetail | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [approvalsUpdatedAt, setApprovalsUpdatedAt] = useState<string | null>(null);
  const [notificationsUpdatedAt, setNotificationsUpdatedAt] = useState<string | null>(null);
  const [approvalPage, setApprovalPage] = useState(1);
  const [approvalHasMore, setApprovalHasMore] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});
  const [notificationPage, setNotificationPage] = useState(1);
  const [notificationHasMore, setNotificationHasMore] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeItem[]>([]);
  const [leavePage, setLeavePage] = useState(1);
  const [leaveHasMore, setLeaveHasMore] = useState(false);
  const [leaveUpdatedAt, setLeaveUpdatedAt] = useState<string | null>(null);
  const [leaveTypeId, setLeaveTypeId] = useState<string>('');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveNotes, setLeaveNotes] = useState('');

  const formatNow = () =>
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  const loadApprovals = async (page = 1) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getApprovals(token, page, 10);
      setApprovalItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setApprovalPage(res.data.pagination.current_page);
      setApprovalHasMore(res.data.pagination.has_more);
      setApprovalsUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load approvals.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadNotifications = async (page = 1) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getNotifications(token, page, 10);
      setNotifications((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setNotificationPage(res.data.pagination.current_page);
      setNotificationHasMore(res.data.pagination.has_more);
      setNotificationsUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load notifications.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadLeaveRequests = async (page = 1) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const [requestsRes, typesRes] = await Promise.all([getLeaveRequests(token, page, 10), getLeaveTypes(token)]);
      setLeaveRequests((current) => (page === 1 ? requestsRes.data.items : [...current, ...requestsRes.data.items]));
      setLeavePage(requestsRes.data.pagination.current_page);
      setLeaveHasMore(requestsRes.data.pagination.has_more);
      setLeaveTypes(typesRes.data.items);
      if (!leaveTypeId && typesRes.data.items.length > 0) {
        setLeaveTypeId(typesRes.data.items[0].id);
      }
      setLeaveUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load leave requests.');
    } finally {
      setModuleLoading(false);
    }
  };

  const setApprovalStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    setModuleLoading(true);
    try {
      const note = approvalNotes[id]?.trim();
      if (status === 'Approved') {
        await approveItem(token, id, note);
      } else {
        await rejectItem(token, id, note);
      }
      setApprovalNotes((current) => ({ ...current, [id]: '' }));
      await loadApprovals(1);
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to update approval.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadApprovalDetail = async (id: string) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getApprovalDetail(token, id);
      setApprovalDetail(res.data);
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load approval details.');
    } finally {
      setModuleLoading(false);
    }
  };

  const markOneNotificationRead = async (id: string) => {
    setModuleLoading(true);
    try {
      await markNotificationRead(token, id);
      await loadNotifications(1);
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to update notification.');
    } finally {
      setModuleLoading(false);
    }
  };

  const markAllRead = async () => {
    setModuleLoading(true);
    try {
      await markAllNotificationsRead(token);
      await loadNotifications(1);
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to update notifications.');
    } finally {
      setModuleLoading(false);
    }
  };

  const submitLeaveRequest = async () => {
    if (!leaveStart || !leaveEnd) {
      setModuleError('Start date and end date are required (YYYY-MM-DD).');
      return;
    }

    setModuleLoading(true);
    setModuleError(null);
    try {
      const payload: { leave_type_id?: string; leave_type?: string; date_start: string; date_end: string; notes?: string } = {
        date_start: leaveStart.trim(),
        date_end: leaveEnd.trim(),
        notes: leaveNotes.trim() || undefined,
      };

      if (leaveTypeId) {
        payload.leave_type_id = leaveTypeId;
      } else {
        payload.leave_type = 'Other';
      }

      await createLeaveRequest(token, payload);
      setLeaveNotes('');
      await loadLeaveRequests(1);
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to submit leave request.');
    } finally {
      setModuleLoading(false);
    }
  };

  const resolveNotificationTarget = (item: NotificationItem): { module: string; approvalId?: string } => {
    if (item.module && item.module.trim() !== '') {
      return {
        module: item.module,
        approvalId: item.target_id ? String(item.target_id) : undefined,
      };
    }

    const payload = item.data ?? {};
    const moduleFromPayload = String((payload['module'] ?? payload['target_module'] ?? '') || '');
    const approvalId =
      String((payload['approval_id'] ?? payload['requisition_id'] ?? payload['target_id'] ?? '') || '') || undefined;

    if (moduleFromPayload) {
      return { module: moduleFromPayload, approvalId };
    }

    const haystack = `${item.title} ${item.body}`.toLowerCase();
    if (haystack.includes('approval') || haystack.includes('requisition')) {
      return { module: 'Approvals', approvalId };
    }

    return { module: 'Notifications' };
  };

  const openNotificationTarget = async (item: NotificationItem) => {
    if (!item.read) {
      await markOneNotificationRead(item.id);
    }

    const target = resolveNotificationTarget(item);
    onOpenAction(target.module);

    if (target.module === 'Approvals' && target.approvalId) {
      await loadApprovalDetail(target.approvalId);
    }
  };

  useEffect(() => {
    if (selectedModule === 'Approvals' && approvalItems.length === 0) {
      void loadApprovals(1);
    }
    if (selectedModule === 'Notifications' && notifications.length === 0) {
      void loadNotifications(1);
    }
    if (selectedModule === 'Leave Requests' && leaveRequests.length === 0) {
      void loadLeaveRequests(1);
    }
  }, [selectedModule]);

  const onPullRefresh = async () => {
    setRefreshing(true);
    try {
      if (selectedModule === 'Approvals') {
        await loadApprovals(1);
      } else if (selectedModule === 'Notifications') {
        await loadNotifications(1);
      } else if (selectedModule === 'Leave Requests') {
        await loadLeaveRequests(1);
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.appShell}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 108 + insets.bottom }]}
        refreshControl={
          activeTab === 'modules' ? <RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} /> : undefined
        }
      >
        <View style={styles.topHeader}>
          <Image source={{ uri: logoUri }} style={styles.mainLogo} resizeMode="contain" />
          <Pressable style={styles.topHeaderButton} onPress={() => onOpenAction('Notifications')}>
            <Text style={styles.topHeaderButtonText}>◉</Text>
          </Pressable>
        </View>

        {activeTab === 'dashboard' ? (
          <>
            <View style={styles.headerCard}>
              <View>
                <Text style={styles.helloText}>Hello, {user?.name || user?.username}</Text>
                <Text style={styles.smallMuted}>Employee self-service</Text>
              </View>
              <Pressable style={styles.refreshPill} onPress={onRefreshProfile} disabled={loading}>
                <Text style={styles.refreshPillText}>Refresh</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.grid}>
                {summaryTiles.map((tile) => (
                  <View key={tile.title} style={styles.tile}>
                    <Text style={styles.tileLabel}>{tile.title}</Text>
                    <Text style={styles.tileValue}>{tile.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.grid}>
                {quickActions.map((item) => (
                  <Pressable key={item.title} style={styles.actionTile} onPress={() => onOpenAction(item.title)}>
                    <Text style={styles.actionTitle}>{item.title}</Text>
                    <Text style={styles.actionHint}>{item.hint}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Menu</Text>
              <View style={styles.menuWrap}>
                {menuItems.map((item) => (
                  <Pressable key={item} style={styles.menuChip} onPress={() => onOpenAction(item)}>
                    <Text style={styles.menuChipText}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        ) : null}

        {activeTab === 'payroll' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payroll</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.tileLabel}>Current month gross</Text>
              <Text style={styles.highlight}>TZS 0.00</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.rowBetween}>
              <Text style={styles.tileLabel}>Deductions</Text>
              <Text style={styles.tileValue}>TZS 0.00</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.tileLabel}>Net pay</Text>
              <Text style={styles.tileValue}>TZS 0.00</Text>
            </View>
            <Pressable style={styles.primaryAction} onPress={() => onOpenAction('Download Payslip')}>
              <Text style={styles.primaryActionText}>Download Last Payslip</Text>
            </Pressable>
          </View>
        ) : null}

        {activeTab === 'modules' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Modules Workspace</Text>
            <Text style={styles.moduleLead}>Current module: {selectedModule}</Text>
            <Text style={styles.moduleBody}>
              This workspace will host list, detail, and action flows for {selectedModule}. Next step is wiring
              real API-backed screens for each module.
            </Text>

            <View style={styles.menuWrap}>
              {menuItems.map((item) => (
                <Pressable key={item} style={styles.menuChip} onPress={() => onOpenAction(item)}>
                  <Text style={styles.menuChipText}>{item}</Text>
                </Pressable>
              ))}
              {quickActions.map((item) => (
                <Pressable key={item.title} style={styles.menuChipAlt} onPress={() => onOpenAction(item.title)}>
                  <Text style={styles.menuChipText}>{item.title}</Text>
                </Pressable>
              ))}
            </View>

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
                    <Pressable style={styles.detailsButton} onPress={() => void loadApprovals(1)}>
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
                  <Text style={styles.approvalsTitle}>Notifications</Text>
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
                  <TextInput
                    style={styles.approvalNoteInput}
                    placeholder="Start date (YYYY-MM-DD)"
                    placeholderTextColor="#96a2b8"
                    value={leaveStart}
                    onChangeText={setLeaveStart}
                  />
                  <TextInput
                    style={styles.approvalNoteInput}
                    placeholder="End date (YYYY-MM-DD)"
                    placeholderTextColor="#96a2b8"
                    value={leaveEnd}
                    onChangeText={setLeaveEnd}
                  />
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
                  <View key={item.id} style={styles.approvalCard}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{item.id}</Text>
                      <Text style={styles.approvalStatus}>{item.status}</Text>
                    </View>
                    <Text style={styles.approvalType}>{item.leave_type}</Text>
                    <Text style={styles.approvalOwner}>
                      {item.date_start || '-'} to {item.date_end || '-'} {item.days_requested ? `(${item.days_requested} days)` : ''}
                    </Text>
                    <Text style={styles.approvalOwner}>{item.notes || '-'}</Text>
                  </View>
                ))}

                {leaveHasMore ? (
                  <Pressable style={styles.detailsButton} onPress={() => void loadLeaveRequests(leavePage + 1)}>
                    <Text style={styles.detailsButtonText}>Load more leave requests</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'account' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account Summary</Text>
            <Text style={styles.meta}>Name: {user?.name}</Text>
            <Text style={styles.meta}>Username: {user?.username}</Text>
            <Text style={styles.meta}>Email: {user?.email}</Text>

            <Pressable style={styles.secondaryAction} onPress={onRefreshProfile} disabled={loading}>
              <Text style={styles.secondaryActionText}>Sync Account</Text>
            </Pressable>
            <Pressable
              style={[styles.dangerAction, loading ? styles.disabled : null]}
              onPress={onLogout}
              disabled={loading}
            >
              <Text style={styles.dangerActionText}>Logout</Text>
            </Pressable>
          </View>
        ) : null}

        {loading || moduleLoading ? <ActivityIndicator color="#00c8ff" style={styles.loader} /> : null}
        <Text style={styles.footerLight}>Technaware ERP Mobile</Text>
      </ScrollView>

      <View style={[styles.bottomNav, { bottom: insets.bottom > 0 ? insets.bottom : 14 }]}>
        <Pressable onPress={() => onSetTab('dashboard')} style={styles.navItem}>
          <Text style={[styles.navIcon, activeTab === 'dashboard' ? styles.navActive : null]}>⌂</Text>
          <Text style={[styles.navLabel, activeTab === 'dashboard' ? styles.navActive : null]}>Home</Text>
        </Pressable>
        <Pressable onPress={() => onSetTab('modules')} style={styles.navItem}>
          <Text style={[styles.navIcon, activeTab === 'modules' ? styles.navActive : null]}>▦</Text>
          <Text style={[styles.navLabel, activeTab === 'modules' ? styles.navActive : null]}>Modules</Text>
        </Pressable>
        <Pressable onPress={() => onSetTab('payroll')} style={styles.navItem}>
          <Text style={[styles.navIcon, activeTab === 'payroll' ? styles.navActive : null]}>▤</Text>
          <Text style={[styles.navLabel, activeTab === 'payroll' ? styles.navActive : null]}>Payroll</Text>
        </Pressable>
        <Pressable onPress={() => onSetTab('account')} style={styles.navItem}>
          <Text style={[styles.navIcon, activeTab === 'account' ? styles.navActive : null]}>◉</Text>
          <Text style={[styles.navLabel, activeTab === 'account' ? styles.navActive : null]}>Summary</Text>
        </Pressable>
      </View>
    </View>
  );
}
