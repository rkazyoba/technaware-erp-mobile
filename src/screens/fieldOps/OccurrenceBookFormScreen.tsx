import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { createFieldOpsOb, getFieldOpsOb, getFieldOpsSites, type FieldOpsSite } from '../../api';
import { Text } from '../../components/AppTypography';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useStaffPortal } from '../../context/StaffPortalContext';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';
import { portalModuleAccessGate } from '../../utils/portalModuleAccess';
import { styles } from '../../styles/appStyles';

export function OccurrenceBookFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule, onPortalNotify } = useStaffPortal();
  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Occurrence Book'), [portal]);

  const [sites, setSites] = useState<FieldOpsSite[]>([]);
  const [siteId, setSiteId] = useState('');
  const [title, setTitle] = useState('');
  const [narrative, setNarrative] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [entries, setEntries] = useState<Record<string, unknown>[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Occurrence Book');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  const reload = useCallback(async () => {
    try {
      const [sitesRes, obRes] = await Promise.all([getFieldOpsSites(token), getFieldOpsOb(token)]);
      setSites(sitesRes.data.items);
      if (!siteId && sitesRes.data.items[0]) setSiteId(sitesRes.data.items[0].id);
      setEntries(obRes.data.entries);
    } catch {
      setEntries([]);
    }
  }, [siteId, token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const submit = async () => {
    setError(null);
    if (!siteId || !title.trim() || !narrative.trim()) {
      setError('Site, title and narrative are required.');
      return;
    }
    setSaving(true);
    try {
      await createFieldOpsOb(token, {
        site_id: siteId,
        occurred_at: new Date().toISOString(),
        severity,
        title: title.trim(),
        narrative: narrative.trim(),
      });
      setTitle('');
      setNarrative('');
      onPortalNotify?.('OB entry saved.', 'success');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
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
        <Text>No access to occurrence book.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => navigation.goBack()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>Occurrence book</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.leaveFormCard}>
          <Text style={styles.approvalType}>Site</Text>
          <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
            {sites.map((s) => (
              <Pressable key={s.id} style={[styles.leaveTypeChip, siteId === s.id ? styles.leaveTypeChipActive : null]} onPress={() => setSiteId(s.id)}>
                <Text style={styles.menuChipText}>{s.name}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.approvalType, { marginTop: 12 }]}>Severity</Text>
          <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
            {['info', 'low', 'medium', 'high', 'critical'].map((s) => (
              <Pressable key={s} style={[styles.leaveTypeChip, severity === s ? styles.leaveTypeChipActive : null]} onPress={() => setSeverity(s)}>
                <Text style={styles.menuChipText}>{s}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput style={[styles.approvalNoteInput, { marginTop: 12 }]} placeholder="Title" value={title} onChangeText={setTitle} />
          <TextInput
            style={[styles.approvalNoteInput, { marginTop: 10, minHeight: 90, textAlignVertical: 'top' }]}
            placeholder="Narrative"
            value={narrative}
            onChangeText={setNarrative}
            multiline
          />
          {error ? <Text style={{ color: '#b42318', marginTop: 8 }}>{error}</Text> : null}
          <Pressable style={[styles.primaryAction, { marginTop: 12 }, saving ? { opacity: 0.65 } : null]} onPress={() => void submit()} disabled={saving}>
            <Text style={styles.primaryActionText}>Save OB entry</Text>
          </Pressable>
        </View>
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Recent entries</Text>
        {entries.map((e, idx) => (
          <View key={String(e.id ?? idx)} style={[styles.card, { marginBottom: 8 }]}>
            <Text style={{ ...outfit('semibold', 14) }}>{String(e.title ?? '')}</Text>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>
              {String(e.site_name ?? '')} · {String(e.severity ?? '')}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
