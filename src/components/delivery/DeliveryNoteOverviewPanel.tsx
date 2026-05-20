import { View } from 'react-native';
import { Text } from '../AppTypography';
import { StatusBadge } from '../StatusBadge';
import type { LogisticsDocDetail } from '../../api';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';

function formatDocDate(value?: string | null): string {
  if (!value) {
    return '—';
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return value;
  }
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.borderSubtle,
      }}
    >
      <Text style={{ ...outfit('medium', 12), color: colors.textMuted, flex: 1, marginRight: 12 }}>{label}</Text>
      <Text style={{ ...outfit('medium', 14), color: colors.textPrimary, flex: 1.4, textAlign: 'right' }}>{value || '—'}</Text>
    </View>
  );
}

type Props = {
  detail: LogisticsDocDetail;
  lineCount: number;
};

export function DeliveryNoteOverviewPanel({ detail, lineCount }: Props) {
  const customerLabel =
    detail.customer_name?.trim() ||
    detail.context?.trim() ||
    '—';
  const customerCode = detail.customer_code?.trim();

  return (
    <View>
      <View
        style={{
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 0.5,
          borderColor: colors.borderSubtle,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <StatusBadge label={detail.status_label} />
        <Text style={{ ...outfit('medium', 20), color: colors.textPrimary, marginTop: 12 }}>{detail.ref}</Text>
        {detail.description?.trim() ? (
          <Text style={{ ...outfit('regular', 15), color: colors.textSecondary, marginTop: 8, lineHeight: 22 }}>
            {detail.description.trim()}
          </Text>
        ) : null}
        <View
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTopWidth: 0.5,
            borderTopColor: colors.borderSubtle,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ ...outfit('medium', 18), color: colors.primaryNavy }}>{lineCount}</Text>
            <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 2 }}>Lines</Text>
          </View>
          <View style={{ width: 0.5, backgroundColor: colors.borderSubtle }} />
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }} numberOfLines={1}>
              {formatDocDate(detail.despatch_date ?? detail.document_date)}
            </Text>
            <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 2 }}>Despatch</Text>
          </View>
        </View>
      </View>

      <View
        style={{
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 0.5,
          borderColor: colors.borderSubtle,
          paddingHorizontal: 16,
          paddingBottom: 4,
        }}
      >
        <Text
          style={{
            ...outfit('medium', 11),
            color: colors.textMuted,
            letterSpacing: 0.66,
            textTransform: 'uppercase',
            paddingTop: 14,
            paddingBottom: 4,
          }}
        >
          Delivery note details
        </Text>
        <MetaRow label="Customer" value={customerCode ? `${customerLabel} (${customerCode})` : customerLabel} />
        <MetaRow label="Prepared date" value={formatDocDate(detail.prepared_date)} />
        <MetaRow label="Despatch date" value={formatDocDate(detail.despatch_date ?? detail.document_date)} />
        <MetaRow label="Order no." value={detail.order_no?.trim() ?? ''} />
        <MetaRow label="Prepared by" value={detail.prepared_by_name?.trim() ?? ''} />
        <MetaRow label="Status" value={detail.status_label} />
      </View>
    </View>
  );
}
