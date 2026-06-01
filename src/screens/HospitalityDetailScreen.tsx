import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../components/AppTypography';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { styles } from '../styles/appStyles';

type Nav = NativeStackNavigationProp<ModulesStackParamList>;
type DetailRoute = RouteProp<ModulesStackParamList, 'HospitalityDetail'>;

export function HospitalityDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const { detailKind, recordId, titleHint } = route.params;
  const sp = useStaffPortal();

  useEffect(() => {
    if (detailKind === 'reservation') {
      void sp.loadHospitalityReservationDetail(recordId);
      return;
    }
    if (detailKind === 'guest') {
      void sp.loadHospitalityGuestDetail(recordId);
      return;
    }
    void sp.loadHospitalityFolioDetail(recordId);
  }, [detailKind, recordId]);

  const title =
    detailKind === 'reservation' ? 'Reservation detail' : detailKind === 'guest' ? 'Guest detail' : 'Folio detail';

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }} numberOfLines={1}>
          {titleHint ?? title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        {sp.hospitalityDetailLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 28 }}>
            <ActivityIndicator color={colors.accentTeal} />
            <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 10 }}>Loading details…</Text>
          </View>
        ) : null}

        {sp.hospitalityDetailError ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Could not load details</Text>
            <Text style={styles.emptyStateText}>{sp.hospitalityDetailError}</Text>
          </View>
        ) : null}

        {detailKind === 'reservation' && sp.hospitalityReservationDetail ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>{sp.hospitalityReservationDetail.document_no}</Text>
            <Text style={styles.emptyStateText}>Status: {sp.hospitalityReservationDetail.status}</Text>
            <Text style={styles.emptyStateText}>
              Stay: {sp.hospitalityReservationDetail.arrival_date ?? '—'} → {sp.hospitalityReservationDetail.departure_date ?? '—'}
            </Text>
            <Text style={styles.emptyStateText}>Guest: {sp.hospitalityReservationDetail.guest?.name ?? '—'}</Text>
            <Text style={styles.emptyStateText}>Room: {sp.hospitalityReservationDetail.room_number ?? '—'}</Text>
            <Text style={styles.emptyStateText}>Total: {sp.hospitalityReservationDetail.total_amount}</Text>
            <Text style={styles.emptyStateText}>Folio balance: {sp.hospitalityReservationDetail.folio_balance}</Text>
          </View>
        ) : null}

        {detailKind === 'guest' && sp.hospitalityGuestDetail ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>{sp.hospitalityGuestDetail.name}</Text>
            <Text style={styles.emptyStateText}>Status: {sp.hospitalityGuestDetail.status}</Text>
            <Text style={styles.emptyStateText}>Phone: {sp.hospitalityGuestDetail.phone ?? '—'}</Text>
            <Text style={styles.emptyStateText}>Email: {sp.hospitalityGuestDetail.email ?? '—'}</Text>
            <Text style={styles.emptyStateText}>Country: {sp.hospitalityGuestDetail.country ?? '—'}</Text>
            <Text style={styles.emptyStateText}>
              Document: {sp.hospitalityGuestDetail.document_type ?? '—'} {sp.hospitalityGuestDetail.document_no ?? '—'}
            </Text>
            <Text style={styles.emptyStateText}>Reservations: {sp.hospitalityGuestDetail.reservations.length}</Text>
          </View>
        ) : null}

        {detailKind === 'folio' && sp.hospitalityFolioDetail ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>{sp.hospitalityFolioDetail.reservation_no}</Text>
            <Text style={styles.emptyStateText}>Guest: {sp.hospitalityFolioDetail.guest_name ?? '—'}</Text>
            <Text style={styles.emptyStateText}>Status: {sp.hospitalityFolioDetail.folio_status}</Text>
            <Text style={styles.emptyStateText}>
              Balance: {sp.hospitalityFolioDetail.currency} {sp.hospitalityFolioDetail.folio_balance}
            </Text>
            <Text style={styles.emptyStateText}>Lines: {sp.hospitalityFolioDetail.lines.length}</Text>
            {sp.hospitalityFolioDetail.lines.map((line) => (
              <View key={line.id} style={{ ...styles.approvalCard, marginTop: 8 }}>
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{line.posting_date ?? '—'}</Text>
                  <Text style={styles.approvalStatus}>{line.line_type}</Text>
                </View>
                <Text style={styles.approvalSubject}>{line.description}</Text>
                <Text style={styles.approvalOwner}>
                  {line.currency} {line.amount}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

