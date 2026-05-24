import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { Text } from '../AppTypography';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { styles } from '../../styles/appStyles';

export type StaffFinanceLineRow = {
  id: string;
  line_description: string;
  currency: string;
  amount: number;
};

type StaffFinanceLinesPanelProps = {
  lines: StaffFinanceLineRow[];
  currency: string;
  editable: boolean;
  busy: boolean;
  editingLineId: string | null;
  lineDesc: string;
  lineAmount: string;
  onLineDescChange: (v: string) => void;
  onLineAmountChange: (v: string) => void;
  onEditLine: (line: StaffFinanceLineRow) => void;
  onCancelEdit: () => void;
  onRemoveLine: (lineId: string) => void;
  onSaveLine: () => void;
  /** Scroll parent when a form field is focused (keeps amount visible above keyboard/tab bar). */
  onFormFieldFocus?: () => void;
  addFormTitle?: string;
  editFormTitle?: string;
  emptyHint?: string;
};

const cardStyle = {
  borderRadius: 16,
  backgroundColor: colors.surface,
  borderWidth: 0.5,
  borderColor: colors.borderSubtle,
  padding: 16,
  marginBottom: 12,
} as const;

function fmtAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`.trim();
}

export function StaffFinanceLinesPanel({
  lines,
  currency,
  editable,
  busy,
  editingLineId,
  lineDesc,
  lineAmount,
  onLineDescChange,
  onLineAmountChange,
  onEditLine,
  onCancelEdit,
  onRemoveLine,
  onSaveLine,
  onFormFieldFocus,
  addFormTitle = 'Add amount line',
  editFormTitle = 'Edit line',
  emptyHint = 'Add each expense as a separate line below.',
}: StaffFinanceLinesPanelProps) {
  const total = lines.reduce((sum, ln) => sum + ln.amount, 0);
  const isEditing = editingLineId != null;

  return (
    <View>
      <View style={cardStyle}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>Amount lines</Text>
          <Text style={{ ...outfit('semibold', 15), color: colors.primaryNavy }}>
            {fmtAmount(total, currency)}
          </Text>
        </View>
        <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 4 }}>
          {lines.length} {lines.length === 1 ? 'line' : 'lines'}
        </Text>
      </View>

      <View style={cardStyle}>
        {lines.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Ionicons name="list-outline" size={36} color={colors.textMuted} />
            <Text style={{ ...outfit('medium', 14), color: colors.textSecondary, marginTop: 10 }}>No lines yet</Text>
            <Text style={{ ...outfit('regular', 13), color: colors.textMuted, marginTop: 6, textAlign: 'center' }}>
              {emptyHint}
            </Text>
          </View>
        ) : (
          lines.map((line, index) => (
            <View
              key={line.id}
              style={{
                marginBottom: index < lines.length - 1 ? 10 : 0,
                padding: 14,
                borderRadius: 14,
                backgroundColor: colors.pageBg,
                borderWidth: 0.5,
                borderColor: colors.borderSubtle,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ ...outfit('medium', 14), color: colors.textPrimary, lineHeight: 20 }}>
                    {line.line_description}
                  </Text>
                  <Text style={{ ...outfit('semibold', 15), color: colors.primaryNavy, marginTop: 8 }}>
                    {fmtAmount(line.amount, line.currency || currency)}
                  </Text>
                </View>
                {editable ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable
                      onPress={() => onEditLine(line)}
                      disabled={busy}
                      accessibilityLabel="Edit line"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        borderWidth: 0.5,
                        borderColor: colors.borderSubtle,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      hitSlop={4}
                    >
                      <Ionicons name="create-outline" size={20} color={colors.linkBlue} />
                    </Pressable>
                    <Pressable
                      onPress={() => onRemoveLine(line.id)}
                      disabled={busy}
                      accessibilityLabel="Remove line"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        borderWidth: 0.5,
                        borderColor: colors.borderSubtle,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 8,
                      }}
                      hitSlop={4}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.statusRejectedText} />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          ))
        )}
      </View>

      {editable ? (
        <View
          style={[
            cardStyle,
            isEditing
              ? { borderColor: colors.accentTeal, borderWidth: 1.5 }
              : null,
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>
              {isEditing ? editFormTitle : addFormTitle}
            </Text>
            {isEditing ? (
              <Pressable onPress={onCancelEdit} disabled={busy} hitSlop={8}>
                <Text style={{ ...outfit('medium', 13), color: colors.linkBlue }}>Cancel</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>Description</Text>
          <TextInput
            style={[styles.approvalNoteInput, { minHeight: 44 }]}
            placeholder="What is this amount for?"
            placeholderTextColor={colors.textMuted}
            value={lineDesc}
            onChangeText={onLineDescChange}
            onFocus={onFormFieldFocus}
            editable={!busy}
          />

          <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 12, marginBottom: 6 }}>
            Amount ({currency})
          </Text>
          <TextInput
            style={styles.approvalNoteInput}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={lineAmount}
            onChangeText={onLineAmountChange}
            onFocus={onFormFieldFocus}
            editable={!busy}
          />

          <Pressable
            style={[styles.primaryAction, { marginTop: 16 }, busy ? { opacity: 0.65 } : null]}
            disabled={busy}
            onPress={onSaveLine}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryActionText}>{isEditing ? 'Update line' : 'Add line'}</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
