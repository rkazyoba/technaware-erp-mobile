import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Text } from '../components/AppTypography';
import { EmployeeProfileRequiredCard } from '../components/EmployeeProfileRequiredCard';
import { TopBar } from '../components/TopBar';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import { userHasEmployeeProfile } from '../utils/employeeProfile';

function fmtMoney(n: number): string {
  return `TZS ${n.toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PayslipScreen() {
  const navigation = useNavigation<any>();
  const sp = useStaffPortal();
  const {
    setPortalActiveTab,
    loadPayslips,
    payslipItems,
    payrollError,
    payrollLoading,
    payslipsUpdatedAt,
    refreshing,
    onPullRefresh,
    user,
  } = sp;

  const essBlocked = !userHasEmployeeProfile(user);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('payslip');
      if (!essBlocked) {
        void loadPayslips();
      }
    }, [setPortalActiveTab, loadPayslips, essBlocked]),
  );

  const openPayslip = (id: string, periodHint: string) => {
    navigation.navigate('Modules', {
      screen: 'RecordDetail',
      params: {
        moduleRoute: 'Payslip',
        detailKind: 'payslip',
        recordId: id,
        titleHint: periodHint,
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <TopBar title="Payslip" />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onPullRefresh()} tintColor={colors.accentTeal} />}
      >
        <Text style={{ ...outfit('medium', 15), color: colors.textPrimary }}>My payslips</Text>
        <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 4 }}>
          Last updated: {payslipsUpdatedAt ?? 'Not synced yet'}
        </Text>
        <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 6 }}>
          Only processed and released payslips appear here. Link your ERP user to an employee record in Profile if nothing loads.
        </Text>

        {essBlocked ? <EmployeeProfileRequiredCard title="Payslips unavailable" /> : null}

        {!essBlocked && payrollError ? (
          <View style={{ marginTop: 12, padding: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ color: colors.textPrimary }}>{payrollError}</Text>
            <Pressable onPress={() => void loadPayslips()} style={{ marginTop: 10 }}>
              <Text style={{ color: colors.linkBlue, fontWeight: '500' }}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!essBlocked && payrollLoading && payslipItems.length === 0 ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={colors.accentTeal} />
        ) : null}

        {!essBlocked && !payrollError && !payrollLoading && payslipItems.length === 0 ? (
          <View style={{ marginTop: 16, padding: 16, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>No payslips yet</Text>
            <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 6 }}>
              Payslips show up after payroll is processed and released to staff.
            </Text>
          </View>
        ) : null}

        {!essBlocked
          ? payslipItems.map((p) => {
              const periodLabel = `${p.period_start ?? '—'} → ${p.period_end ?? '—'}`;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => openPayslip(p.id, periodLabel)}
                  style={{
                    marginTop: 10,
                    padding: 12,
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    borderWidth: 0.5,
                    borderColor: colors.borderSubtle,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, flex: 1, marginRight: 8 }}>{periodLabel}</Text>
                    <Text style={{ ...outfit('medium', 13), color: colors.primaryNavy }}>{fmtMoney(p.net_pay)}</Text>
                  </View>
                  <Text style={{ ...outfit('regular', 11), color: colors.textSecondary, marginTop: 6 }}>
                    Gross {fmtMoney(p.gross_salary)} · Deductions {fmtMoney(p.total_deductions)}
                  </Text>
                  {p.released_at ? (
                    <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 4 }}>Released {p.released_at.slice(0, 10)}</Text>
                  ) : null}
                </Pressable>
              );
            })
          : null}
      </ScrollView>
    </View>
  );
}
