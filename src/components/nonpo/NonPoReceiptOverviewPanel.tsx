import { Pressable, TextInput, View } from 'react-native';
import { Text } from '../AppTypography';
import { DatePickerField } from '../DatePickerField';
import { FormSection, ReadonlyField, SearchableSelectField, type SearchableSelectOption } from '../SearchableSelectField';
import { LogisticsLedgerStatusCard } from '../finance/LogisticsLedgerStatusCard';
import { StatusBadge } from '../StatusBadge';
import type { LogisticsDocDetail } from '../../api';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';

function formatDocDate(value?: string | null): string {
  if (!value) {
    return '—';
  }
  const d = new Date(value + 'T12:00:00');
  if (Number.isNaN(d.getTime())) {
    return value;
  }
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtMoney(n: number | null | undefined, currency?: string | null): string {
  if (n == null || Number.isNaN(n)) {
    return '—';
  }
  const cur = currency?.trim() || 'TZS';
  return `${cur} ${n.toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export type NonPoHeaderForm = {
  description: string;
  deliveryNote: string;
  receivedDate: string;
  supplierId: string;
  supplierLabel: string;
  siteId: string;
  siteLabel: string;
  storeId: string;
  storeLabel: string;
  status: string;
};

type Props = {
  detail: LogisticsDocDetail;
  lineCount: number;
  editable: boolean;
  form: NonPoHeaderForm;
  storeOptions: SearchableSelectOption[];
  supplierOptions: SearchableSelectOption[];
  loadingStores?: boolean;
  loadingSuppliers?: boolean;
  onChangeForm: (patch: Partial<NonPoHeaderForm>) => void;
  onSelectStore: (opt: SearchableSelectOption) => void;
  onSelectSupplier: (opt: SearchableSelectOption) => void;
  onSaveHeader?: () => void;
  savingHeader?: boolean;
};

const inputStyle = {
  backgroundColor: colors.pageBg,
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderWidth: 0.5,
  borderColor: colors.borderSubtle,
  ...outfit('regular', 14),
  color: colors.textPrimary,
} as const;

export function NonPoReceiptOverviewPanel({
  detail,
  lineCount,
  editable,
  form,
  storeOptions,
  supplierOptions,
  loadingStores,
  loadingSuppliers,
  onChangeForm,
  onSelectStore,
  onSelectSupplier,
  onSaveHeader,
  savingHeader,
}: Props) {
  const supplierDisplay = detail.supplier_name?.trim() || form.supplierLabel || '—';
  const siteDisplay = detail.site_name?.trim() || form.siteLabel || '—';
  const storeDisplay = detail.store_name?.trim() || form.storeLabel || '—';

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
        {!editable && detail.description?.trim() ? (
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
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ ...outfit('medium', 16), color: colors.primaryNavy }} numberOfLines={1}>
              {fmtMoney(detail.total_amount, detail.base_currency)}
            </Text>
            <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 2 }}>Total</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.primaryNavy }}>{formatDocDate(detail.document_date)}</Text>
            <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 2 }}>Received</Text>
          </View>
        </View>
      </View>

      <LogisticsLedgerStatusCard status={detail.status} ledgerPosted={detail.ledger_posted} />

      {editable ? (
        <>
          <FormSection title="Identification">
            <ReadonlyField label="Receipt no." value={detail.ref} />
            <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>Description</Text>
            <TextInput
              value={form.description}
              onChangeText={(description) => onChangeForm({ description })}
              placeholder="Goods received note for…"
              placeholderTextColor={colors.textMuted}
              style={inputStyle}
            />
          </FormSection>

          <FormSection title="Receipt details">
            <DatePickerField
              label="Received date"
              value={form.receivedDate}
              onChange={(receivedDate) => onChangeForm({ receivedDate })}
              marginTop={0}
            />
            <SearchableSelectField
              label="Supplier"
              placeholder="Search supplier"
              valueLabel={form.supplierLabel}
              loading={loadingSuppliers}
              options={supplierOptions}
              onSelect={onSelectSupplier}
              modalTitle="Supplier"
              searchPlaceholder="Search supplier name"
            />
            <SearchableSelectField
              label="Store"
              hint="Receiving location for this receipt."
              placeholder="Search store"
              valueLabel={form.storeLabel}
              loading={loadingStores}
              options={storeOptions}
              onSelect={onSelectStore}
              modalTitle="Store"
              searchPlaceholder="Search store or site"
            />
            <ReadonlyField label="Site" value={form.siteLabel || siteDisplay} hint="Set automatically from the selected store." />
            <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 8, marginBottom: 6 }}>
              Supplier delivery note
            </Text>
            <TextInput
              value={form.deliveryNote}
              onChangeText={(deliveryNote) => onChangeForm({ deliveryNote })}
              placeholder="Delivery note ref."
              placeholderTextColor={colors.textMuted}
              style={inputStyle}
            />
            <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 14, marginBottom: 8 }}>Status</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { id: '0', label: 'Unfinished' },
                { id: '1', label: 'Awaiting approval' },
              ].map((opt) => (
                <Pressable
                  key={opt.id}
                  onPress={() => onChangeForm({ status: opt.id })}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 0.5,
                    borderColor: form.status === opt.id ? colors.accentTeal : colors.borderSubtle,
                    backgroundColor: form.status === opt.id ? 'rgba(45, 212, 191, 0.12)' : colors.surface,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      ...outfit('medium', 12),
                      color: form.status === opt.id ? colors.accentTeal : colors.textSecondary,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </FormSection>

          {onSaveHeader ? (
            <Pressable
              onPress={onSaveHeader}
              disabled={savingHeader}
              style={{
                marginTop: 4,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: savingHeader ? colors.borderSubtle : colors.primaryNavy,
                alignItems: 'center',
              }}
            >
              <Text style={{ ...outfit('medium', 15), color: '#fff' }}>{savingHeader ? 'Saving…' : 'Save details'}</Text>
            </Pressable>
          ) : null}
        </>
      ) : (
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
          <MetaRow label="Description" value={detail.description?.trim() || '—'} />
          <MetaRow label="Received" value={formatDocDate(detail.document_date)} />
          <MetaRow label="Supplier" value={supplierDisplay} />
          <MetaRow label="Site" value={siteDisplay} />
          <MetaRow label="Store" value={storeDisplay} />
          <MetaRow label="Delivery note" value={detail.delivery_note?.trim() || form.deliveryNote || '—'} />
          <MetaRow label="Total" value={fmtMoney(detail.total_amount, detail.base_currency)} />
        </View>
      )}
    </View>
  );
}
