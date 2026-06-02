import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getRequisitionCreateContext, postRequisitionHeader } from '../api';
import { Text } from '../components/AppTypography';
import { StaffFinanceSiteStoreFields } from '../components/finance/StaffFinanceSiteStoreFields';
import { TopBar, TopBarIconButton } from '../components/TopBar';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import { useModulesTabScrollInsets } from '../hooks/useModulesTabScrollInsets';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { canCrudOrLegacy } from '../utils/crudPermissions';
import { portalModuleAccessGate } from '../utils/portalModuleAccess';
import { styles } from '../styles/appStyles';

export function RequisitionHeaderScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule, onPortalNotify } = useStaffPortal();
  const { scrollBottomPadding, keyboardVerticalOffset } = useModulesTabScrollInsets();

  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Requisitions'), [portal]);
  const canCreate = useMemo(
    () => canCrudOrLegacy(portal, 'requisitions', 'create', ['erp.user.requisitions']),
    [portal],
  );

  const [loading, setLoading] = useState(true);
  const [requisitionNo, setRequisitionNo] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('1');
  const [priorities, setPriorities] = useState<Array<{ value: string; label: string }>>([]);
  const [sites, setSites] = useState<Array<{ id: string; label: string }>>([]);
  const [stores, setStores] = useState<Array<{ id: string; site_id: string; label: string }>>([]);
  const [siteId, setSiteId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [requestorId, setRequestorId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Requisitions');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await getRequisitionCreateContext(token);
        if (cancelled) return;
        setRequisitionNo(res.data.suggested_requisition_no);
        setPriorities(res.data.priorities);
        setSites(res.data.sites);
        setStores(res.data.stores);
        setRequestorId(res.data.requestor_id);
        setBuyerId(res.data.buyer_id);
        if (res.data.default_site_id) setSiteId(res.data.default_site_id);
        if (res.data.default_store_id) setStoreId(res.data.default_store_id);
        if (res.data.priorities.length > 0) {
          const medium = res.data.priorities.find((p) => p.value === '1');
          setPriority(medium?.value ?? res.data.priorities[0]!.value);
        }
      } catch (e) {
        if (!cancelled) {
          setFormError(e instanceof Error ? e.message : 'Could not load requisition defaults.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async () => {
    setFormError(null);
    if (!description.trim()) {
      setFormError('Enter a description.');
      return;
    }
    if (!siteId || !storeId) {
      setFormError('Select site and store.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await postRequisitionHeader(token, {
        requisition_no: requisitionNo.trim() || undefined,
        description: description.trim(),
        priority,
        site_id: siteId,
        store_id: storeId,
        buyer: buyerId ?? undefined,
        requestor: requestorId || undefined,
      });
      onPortalNotify?.('Requisition created. Add line items next.', 'success');
      navigation.replace('RequisitionWorkspace', { requisitionId: res.data.id, initialTab: 'lines' });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to create requisition.');
    } finally {
      setSubmitting(false);
    }
  };

  if (moduleGate === 'pending' || loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accentTeal} />
      </View>
    );
  }

  if (moduleGate === 'denied' || !canCreate) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top']}>
        <TopBar title="New requisition" left={<TopBarIconButton name="chevron-back" onPress={() => navigation.goBack()} />} />
        <View style={{ padding: 20 }}>
          <Text style={styles.emptyStateTitle}>Not available</Text>
          <Text style={styles.emptyStateText}>You do not have permission to create requisitions.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top']}>
      <TopBar title="New requisition" left={<TopBarIconButton name="chevron-back" onPress={() => navigation.goBack()} />} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: scrollBottomPadding }}>
          <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 16 }}>
            Create the header, then add line items and submit for approval. RFQs and purchase orders stay on the web ERP.
          </Text>

          <Text style={[styles.approvalType, { marginTop: 4 }]}>Requisition no.</Text>
          <TextInput
            style={[styles.input, { marginTop: 6, marginBottom: 12 }]}
            value={requisitionNo}
            onChangeText={setRequisitionNo}
            placeholder="Auto-suggested number"
          />

          <Text style={[styles.approvalType, { marginTop: 4 }]}>Description *</Text>
          <TextInput
            style={[styles.input, { marginTop: 6, marginBottom: 12, minHeight: 72 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="What are you requesting?"
            multiline
          />

          <StaffFinanceSiteStoreFields
            sites={sites}
            stores={stores}
            siteId={siteId}
            storeId={storeId}
            onSiteChange={(id) => {
              setSiteId(id);
              setStoreId('');
            }}
            onStoreChange={setStoreId}
          />

          <Text style={[styles.approvalType, { marginTop: 12 }]}>Priority *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 12 }}>
            {priorities.map((p) => {
              const active = priority === p.value;
              return (
                <Pressable
                  key={p.value}
                  onPress={() => setPriority(p.value)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: active ? colors.accentTeal : colors.surface,
                    borderWidth: 1,
                    borderColor: active ? colors.accentTeal : colors.borderSubtle,
                  }}
                >
                  <Text style={{ ...outfit('medium', 13), color: active ? '#fff' : colors.textPrimary }}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {formError ? (
            <Text style={{ ...outfit('regular', 13), color: colors.trendDown, marginBottom: 12 }}>{formError}</Text>
          ) : null}

          <Pressable
            style={[styles.detailsButton, submitting && { opacity: 0.6 }]}
            onPress={() => void submit()}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.accentTeal} />
            ) : (
              <Text style={styles.detailsButtonText}>Save header & add lines</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
