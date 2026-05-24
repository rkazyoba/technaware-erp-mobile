import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native';
import {
  approvePettyCashFinance,
  approvePettyCashRetirement,
  approvePettyCashSite,
  rejectPettyCashRequest,
  type PettyCashRequestDetail,
} from '../../api';
import { Text } from '../AppTypography';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { styles } from '../../styles/appStyles';

type GlAccount = { id: string; code: string; name: string };

const ACTION_BTN = {
  flex: 1,
  minWidth: 100,
  minHeight: 48,
  paddingVertical: 14,
  paddingHorizontal: 12,
  borderRadius: 10,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

type StaffFinanceApprovalPanelProps = {
  token: string;
  recordId: string;
  detail: PettyCashRequestDetail;
  onUpdated: (detail: PettyCashRequestDetail) => void;
  onNotify?: (message: string, type?: 'success' | 'error') => void;
};

export function StaffFinanceApprovalPanel({ token, recordId, detail, onUpdated, onNotify }: StaffFinanceApprovalPanelProps) {
  const ui = detail.approval_ui;

  if (detail.viewer_is_requester || !ui || (!ui.can_approve_site && !ui.can_approve_finance)) {
    return null;
  }

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [glPickerOpen, setGlPickerOpen] = useState(false);
  const [selectedGlId, setSelectedGlId] = useState<string>('');

  const glAccounts = (ui.gl_accounts ?? []) as GlAccount[];
  const selectedGl = glAccounts.find((a) => a.id === selectedGlId);
  const canReject = ui.can_reject && (ui.can_approve_site || ui.can_approve_finance);

  const run = async (fn: () => Promise<{ data: PettyCashRequestDetail; message?: string }>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      onUpdated(res.data);
      onNotify?.(res.message ?? 'Done.', 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Action failed.';
      setError(msg);
      onNotify?.(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  const approveFinance = () => {
    if (ui.requires_expense_gl && !selectedGlId) {
      setError('Select an expense GL account.');
      setGlPickerOpen(true);
      return;
    }
    const body = ui.requires_expense_gl ? { debit_account_id: Number.parseInt(selectedGlId, 10) } : {};
    const isRetirement =
      detail.request_type === 'imprest_retirement' || detail.workflow_status === 'pending_retirement_review';
    void run(() =>
      isRetirement
        ? approvePettyCashRetirement(token, recordId, body.debit_account_id as number)
        : approvePettyCashFinance(token, recordId, body.debit_account_id as number | undefined),
    );
  };

  const imprestGlBlocked =
    Boolean(ui.imprest_auto_ledger && ui.imprest_employee_gl && 'error' in ui.imprest_employee_gl);

  return (
    <View style={[styles.leaveFormCard, { marginTop: 12 }]}>
      <Text style={{ ...outfit('medium', 14), color: colors.textPrimary, marginBottom: 8 }}>Approval actions</Text>

      {ui.imprest_auto_ledger && ui.imprest_employee_gl ? (
        <View style={{ marginBottom: 12 }}>
          {'error' in ui.imprest_employee_gl && ui.imprest_employee_gl.error ? (
            <Text style={{ ...outfit('regular', 13), color: colors.trendDown }}>{String(ui.imprest_employee_gl.error)}</Text>
          ) : (
            <>
              <Text style={{ ...outfit('regular', 12), color: colors.textMuted }}>Ledger posting (automatic)</Text>
              <Text style={{ ...outfit('regular', 13), color: colors.textPrimary, marginTop: 4 }}>
                Debit: {ui.imprest_employee_gl.gl_code} — {ui.imprest_employee_gl.gl_name}
              </Text>
              <Text style={{ ...outfit('regular', 13), color: colors.textPrimary, marginTop: 2 }}>
                Credit: {ui.petty_cash_pool_gl_code} — Petty cash float
              </Text>
              <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 4 }}>
                {ui.imprest_employee_gl.employee_code} — {ui.imprest_employee_gl.employee_name}
              </Text>
            </>
          )}
        </View>
      ) : null}

      {ui.requires_expense_gl ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>Expense GL (debit) *</Text>
          <Pressable
            onPress={() => setGlPickerOpen(true)}
            style={{
              padding: 12,
              borderRadius: 10,
              borderWidth: 0.5,
              borderColor: colors.borderSubtle,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ ...outfit('regular', 14), color: selectedGl ? colors.textPrimary : colors.textMuted }}>
              {selectedGl ? `${selectedGl.code} — ${selectedGl.name}` : 'Tap to select GL account'}
            </Text>
          </Pressable>
          {detail.request_type === 'imprest_retirement' && detail.imprest_parent_debit_gl ? (
            <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 6 }}>
              Credits employee GL: {detail.imprest_parent_debit_gl.code} — {detail.imprest_parent_debit_gl.name}
            </Text>
          ) : null}
          {!ui.imprest_auto_ledger ? (
            <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 6 }}>
              Settlement via {ui.payment_method_label ?? 'payment method'} ({ui.petty_cash_pool_gl_code} for cash).
            </Text>
          ) : null}
        </View>
      ) : null}

      {error ? <Text style={{ ...outfit('regular', 13), color: colors.trendDown, marginBottom: 8 }}>{error}</Text> : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'stretch' }}>
        {ui.can_approve_site ? (
          <Pressable
            style={[ACTION_BTN, { backgroundColor: colors.primaryNavy }, busy ? { opacity: 0.6 } : null]}
            disabled={busy}
            onPress={() => void run(() => approvePettyCashSite(token, recordId))}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryActionText}>Approve (site)</Text>
            )}
          </Pressable>
        ) : null}
        {ui.can_approve_finance ? (
          <Pressable
            style={[ACTION_BTN, { backgroundColor: colors.primaryNavy }, busy || imprestGlBlocked ? { opacity: 0.6 } : null]}
            disabled={busy || imprestGlBlocked}
            onPress={() => approveFinance()}
          >
            <Text style={styles.primaryActionText}>
              {detail.request_type === 'imprest_retirement' ? 'Approve retirement' : 'Approve & post'}
            </Text>
          </Pressable>
        ) : null}
        {canReject ? (
          <Pressable
            style={[
              ACTION_BTN,
              {
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.statusRejectedText,
              },
              busy ? { opacity: 0.6 } : null,
            ]}
            disabled={busy}
            onPress={() => void run(() => rejectPettyCashRequest(token, recordId))}
          >
            <Text style={{ ...outfit('medium', 13), color: colors.statusRejectedText }}>Reject</Text>
          </Pressable>
        ) : null}
      </View>

      <Modal visible={glPickerOpen} transparent animationType="slide" onRequestClose={() => setGlPickerOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setGlPickerOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%' }}>
            <Text style={{ ...outfit('medium', 16), color: colors.textPrimary, padding: 16 }}>Select expense GL</Text>
            <ScrollView style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
              {glAccounts.length === 0 ? (
                <Text style={{ ...outfit('regular', 13), color: colors.textMuted }}>No GL accounts configured.</Text>
              ) : (
                glAccounts.map((acc) => (
                  <Pressable
                    key={acc.id}
                    onPress={() => {
                      setSelectedGlId(acc.id);
                      setGlPickerOpen(false);
                    }}
                    style={{
                      paddingVertical: 12,
                      borderBottomWidth: 0.5,
                      borderBottomColor: colors.borderSubtle,
                    }}
                  >
                    <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>{acc.code}</Text>
                    <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>{acc.name}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
