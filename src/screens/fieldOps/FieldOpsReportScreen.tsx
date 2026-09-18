import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import {
  getFieldOpsReportDaily,
  getFieldOpsReportMonthly,
  getFieldOpsReportWeekly,
  type FieldOpsReportPayload,
} from '../../api';
import { Text } from '../../components/AppTypography';
import { DatePickerField } from '../../components/DatePickerField';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useStaffPortal } from '../../context/StaffPortalContext';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';
import { portalModuleAccessGate } from '../../utils/portalModuleAccess';
import { styles } from '../../styles/appStyles';

function isoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function FieldOpsReportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule } = useStaffPortal();
  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Deployment Reports'), [portal]);

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [date, setDate] = useState(isoToday());
  const [report, setReport] = useState<FieldOpsReportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Deployment Reports');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res =
        period === 'weekly'
          ? await getFieldOpsReportWeekly(token, { weekStart: date })
          : period === 'monthly'
            ? await getFieldOpsReportMonthly(token, { month: date.slice(0, 7) })
            : await getFieldOpsReportDaily(token, { date });
      setReport(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load report');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  if (moduleGate === 'pending') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.pageBg }}>
        <ActivityIndicator color={colors.accentTeal} />
      </View>
    );
  }
  if (moduleGate === 'denied') {
    return (
      <View style={{ flex: 1, padding: 20, backgroundColor: colors.pageBg }}>
        <Text style={{ ...outfit('medium', 16) }}>No access to deployment reports.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => navigation.goBack()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>Deployment reports</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={[styles.leaveTypeWrap, { marginBottom: 12 }]}>
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <Pressable key={p} style={[styles.leaveTypeChip, period === p ? styles.leaveTypeChipActive : null]} onPress={() => setPeriod(p)}>
              <Text style={styles.menuChipText}>{p}</Text>
            </Pressable>
          ))}
        </View>
        <DatePickerField label={period === 'monthly' ? 'Any day in month' : period === 'weekly' ? 'Week start' : 'Date'} value={date} onChange={setDate} />
        <Pressable style={[styles.primaryAction, { marginTop: 12 }]} onPress={() => void run()}>
          <Text style={styles.primaryActionText}>Run report</Text>
        </Pressable>
        {loading ? <ActivityIndicator style={{ marginTop: 20 }} color={colors.accentTeal} /> : null}
        {error ? <Text style={{ color: '#b42318', marginTop: 12 }}>{error}</Text> : null}
        {report ? (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionTitle}>
              {report.period.from} → {report.period.to}
            </Text>
            <View style={styles.grid}>
              <View style={styles.tile}>
                <Text style={styles.tileLabel}>Present</Text>
                <Text style={styles.tileValue}>{report.totals.present}</Text>
              </View>
              <View style={styles.tile}>
                <Text style={styles.tileLabel}>Absent</Text>
                <Text style={styles.tileValue}>{report.totals.absent}</Text>
              </View>
            </View>
            {report.sites.map((row, idx) => (
              <View key={`${row.site_id}-${row.shift_slot}-${idx}`} style={[styles.card, { marginTop: 10 }]}>
                <Text style={{ ...outfit('semibold', 14) }}>{row.site_name || `Site ${row.site_id}`}</Text>
                <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>
                  {row.shift_slot}: {row.present}/{row.marked} present ({row.present_pct}%)
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
