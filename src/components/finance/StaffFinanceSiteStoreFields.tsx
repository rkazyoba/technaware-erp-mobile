import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../AppTypography';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { styles } from '../../styles/appStyles';

export type StaffFinanceSiteOption = { id: string; label: string };
export type StaffFinanceStoreOption = { id: string; site_id: string; label: string };

type StaffFinanceSiteStoreFieldsProps = {
  sites: StaffFinanceSiteOption[];
  stores: StaffFinanceStoreOption[];
  siteId: string;
  storeId: string;
  onSiteChange: (id: string) => void;
  onStoreChange: (id: string) => void;
  editable?: boolean;
  siteLabel?: string | null;
  storeLabel?: string | null;
};

export function StaffFinanceSiteStoreFields({
  sites,
  stores,
  siteId,
  storeId,
  onSiteChange,
  onStoreChange,
  editable = true,
  siteLabel,
  storeLabel,
}: StaffFinanceSiteStoreFieldsProps) {
  const storesForSite = useMemo(
    () => stores.filter((s) => !siteId || s.site_id === siteId),
    [stores, siteId],
  );

  if (!editable) {
    return (
      <View>
        {siteLabel ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ ...outfit('medium', 11), color: colors.textMuted, marginBottom: 2 }}>Site</Text>
            <Text style={{ ...outfit('regular', 14), color: colors.textPrimary }}>{siteLabel}</Text>
          </View>
        ) : null}
        {storeLabel ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ ...outfit('medium', 11), color: colors.textMuted, marginBottom: 2 }}>Store</Text>
            <Text style={{ ...outfit('regular', 14), color: colors.textPrimary }}>{storeLabel}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      <Text style={[styles.approvalType, { marginTop: 4 }]}>Site (branch) *</Text>
      <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
        {sites.length === 0 ? (
          <Text style={{ ...outfit('regular', 13), color: colors.textMuted }}>No sites available.</Text>
        ) : (
          sites.map((site) => (
            <Pressable
              key={site.id}
              style={[styles.leaveTypeChip, siteId === site.id ? styles.leaveTypeChipActive : null]}
              onPress={() => {
                onSiteChange(site.id);
                if (storeId && !stores.some((st) => st.id === storeId && st.site_id === site.id)) {
                  onStoreChange('');
                }
              }}
            >
              <Text style={styles.menuChipText}>{site.label}</Text>
            </Pressable>
          ))
        )}
      </View>

      <Text style={[styles.approvalType, { marginTop: 16 }]}>Store (warehouse) *</Text>
      <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
        {!siteId ? (
          <Text style={{ ...outfit('regular', 13), color: colors.textMuted }}>Select a site first.</Text>
        ) : storesForSite.length === 0 ? (
          <Text style={{ ...outfit('regular', 13), color: colors.textMuted }}>No stores for this site.</Text>
        ) : (
          storesForSite.map((store) => (
            <Pressable
              key={store.id}
              style={[styles.leaveTypeChip, storeId === store.id ? styles.leaveTypeChipActive : null]}
              onPress={() => onStoreChange(store.id)}
            >
              <Text style={styles.menuChipText}>{store.label}</Text>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}
