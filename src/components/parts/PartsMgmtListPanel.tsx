import { Pressable, View } from 'react-native';
import type {
  PartConversionListItem,
  PartExpirationListItem,
  PartInStoreListItem,
  PriceCatalogListItem,
} from '../../api';
import { Text } from '../AppTypography';
import { ModuleSearchToolbar } from '../ModuleSearchToolbar';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { styles } from '../../styles/appStyles';
import {
  PART_CONVERSIONS_ROUTE,
  PART_EXPIRATION_ROUTE,
  PARTS_IN_STORE_ROUTE,
  PRICE_CATALOG_ROUTE,
  type PartsMgmtModuleRoute,
} from '../../utils/partsMgmtPortal';

type Props = {
  route: PartsMgmtModuleRoute;
  updatedAt: string | null;
  searchInput: string;
  onChangeSearch: (v: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  moduleError: string | null;
  moduleLoading: boolean;
  onRetry: () => void;
  items: PartInStoreListItem[] | PartExpirationListItem[] | PartConversionListItem[] | PriceCatalogListItem[];
  hasMore: boolean;
  onLoadMore: () => void;
  onOpenDetail: (id: string, titleHint: string) => void;
  expiringWithinDays?: number;
  onToggleExpiringFilter?: () => void;
  priceCatalogActiveOnly?: boolean;
  onTogglePriceActiveOnly?: () => void;
};

export function PartsMgmtListPanel({
  route,
  updatedAt,
  searchInput,
  onChangeSearch,
  onSearch,
  onClearSearch,
  moduleError,
  moduleLoading,
  onRetry,
  items,
  hasMore,
  onLoadMore,
  onOpenDetail,
  expiringWithinDays = 0,
  onToggleExpiringFilter,
  priceCatalogActiveOnly = false,
  onTogglePriceActiveOnly,
}: Props) {
  const placeholder =
    route === PART_EXPIRATION_ROUTE
      ? 'Search batch, part, or GRN'
      : route === PRICE_CATALOG_ROUTE
        ? 'Search part code or description'
        : 'Search code or description';

  return (
    <View style={styles.approvalsSection}>
      <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginBottom: 8 }}>
        {route === PARTS_IN_STORE_ROUTE
          ? 'On-hand per warehouse. Open a row for min/max and catalog link.'
          : route === PART_EXPIRATION_ROUTE
            ? 'Lots and expiry from GRNs in your allowed stores.'
            : route === PART_CONVERSIONS_ROUTE
              ? 'Order-unit exchange rates per catalog part.'
              : 'Pricing rows with validity dates; active row drives consumption costing.'}
      </Text>
      <Text style={styles.syncText}>Last updated: {updatedAt ?? 'Not synced yet'}</Text>
      <ModuleSearchToolbar
        value={searchInput}
        onChangeText={onChangeSearch}
        onSearch={onSearch}
        onClear={onClearSearch}
        placeholder={placeholder}
      />
      {route === PART_EXPIRATION_ROUTE && onToggleExpiringFilter ? (
        <Pressable
          onPress={onToggleExpiringFilter}
          style={{
            alignSelf: 'flex-start',
            marginBottom: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 16,
            backgroundColor: expiringWithinDays > 0 ? colors.primaryNavy : colors.surface,
            borderWidth: 0.5,
            borderColor: colors.borderSubtle,
          }}
        >
          <Text style={{ ...outfit('medium', 12), color: expiringWithinDays > 0 ? '#fff' : colors.textPrimary }}>
            {expiringWithinDays > 0 ? `Expiring ≤ ${expiringWithinDays} days` : 'Show expiring ≤ 60 days'}
          </Text>
        </Pressable>
      ) : null}
      {route === PRICE_CATALOG_ROUTE && onTogglePriceActiveOnly ? (
        <Pressable
          onPress={onTogglePriceActiveOnly}
          style={{
            alignSelf: 'flex-start',
            marginBottom: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 16,
            backgroundColor: priceCatalogActiveOnly ? colors.primaryNavy : colors.surface,
            borderWidth: 0.5,
            borderColor: colors.borderSubtle,
          }}
        >
          <Text style={{ ...outfit('medium', 12), color: priceCatalogActiveOnly ? '#fff' : colors.textPrimary }}>
            {priceCatalogActiveOnly ? 'Active prices only' : 'All statuses'}
          </Text>
        </Pressable>
      ) : null}
      {moduleError ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>Could not load</Text>
          <Text style={styles.emptyStateText}>{moduleError}</Text>
          <Pressable style={styles.detailsButton} onPress={onRetry}>
            <Text style={styles.detailsButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      {!moduleError && !moduleLoading && items.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>No records</Text>
        </View>
      ) : null}
      {route === PARTS_IN_STORE_ROUTE
        ? (items as PartInStoreListItem[]).map((item) => (
            <Pressable
              key={item.id}
              style={styles.approvalCard}
              onPress={() => onOpenDetail(item.id, item.code)}
            >
              <View style={styles.approvalHeader}>
                <Text style={styles.approvalId}>{item.code}</Text>
                <Text style={styles.approvalStatus}>{item.status}</Text>
              </View>
              <Text style={styles.approvalSubject} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={styles.approvalOwner}>
                {item.store_name} · Qty {item.quantity} {item.unit}
              </Text>
              {item.tenant_catalog_qty != null ? (
                <Text style={styles.meta}>Tenant catalog total: {item.tenant_catalog_qty}</Text>
              ) : null}
            </Pressable>
          ))
        : null}
      {route === PART_EXPIRATION_ROUTE
        ? (items as PartExpirationListItem[]).map((item) => (
            <Pressable
              key={item.id}
              style={styles.approvalCard}
              onPress={() => onOpenDetail(item.id, item.batch_number ?? item.id)}
            >
              <View style={styles.approvalHeader}>
                <Text style={styles.approvalId}>{item.receipt_no || `GRN #${item.receipt_id}`}</Text>
                <Text style={styles.approvalStatus}>{item.status}</Text>
              </View>
              <Text style={styles.approvalSubject} numberOfLines={1}>
                {item.part_code} — {item.part_description}
              </Text>
              <Text style={styles.approvalOwner}>
                Batch {item.batch_number ?? '—'} · Exp {item.expired_date ?? '—'} · Qty {item.quantity}
              </Text>
            </Pressable>
          ))
        : null}
      {route === PART_CONVERSIONS_ROUTE
        ? (items as PartConversionListItem[]).map((item) => (
            <Pressable
              key={item.id}
              style={styles.approvalCard}
              onPress={() => onOpenDetail(item.id, item.part_code)}
            >
              <View style={styles.approvalHeader}>
                <Text style={styles.approvalId}>{item.part_code}</Text>
              </View>
              <Text style={styles.approvalSubject} numberOfLines={2}>
                {item.part_description}
              </Text>
              <Text style={styles.approvalOwner}>
                1 {item.order_unit} = {item.exchange_rate} (catalog unit)
              </Text>
            </Pressable>
          ))
        : null}
      {route === PRICE_CATALOG_ROUTE
        ? (items as PriceCatalogListItem[]).map((item) => (
            <Pressable
              key={item.id}
              style={styles.approvalCard}
              onPress={() => onOpenDetail(item.id, item.part_code)}
            >
              <View style={styles.approvalHeader}>
                <Text style={styles.approvalId}>{item.part_code}</Text>
                <Text style={styles.approvalStatus}>{item.status}</Text>
              </View>
              <Text style={styles.approvalSubject} numberOfLines={1}>
                {item.part_description}
              </Text>
              <Text style={styles.approvalOwner}>
                {item.currency} {item.price} · {item.start_date ?? '—'} → {item.end_date ?? '—'}
              </Text>
              {item.is_consumption_active ? (
                <Text style={[styles.meta, { color: colors.statusApprovedText }]}>Used for consumption today</Text>
              ) : null}
            </Pressable>
          ))
        : null}
      {hasMore ? (
        <Pressable style={styles.detailsButton} onPress={onLoadMore}>
          <Text style={styles.detailsButtonText}>Load more</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
