import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, TextInput, View } from 'react-native';
import { Text } from './AppTypography';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';

export type SearchableSelectOption = {
  id: string;
  label: string;
  subtitle?: string;
  /** Optional third line (e.g. PO description on GRN order picker). */
  detail?: string;
};

type Props = {
  label: string;
  hint?: string;
  placeholder?: string;
  valueLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  options: SearchableSelectOption[];
  onSelect: (option: SearchableSelectOption) => void;
  onClear?: () => void;
  modalTitle?: string;
  searchPlaceholder?: string;
};

export function SearchableSelectField({
  label,
  hint,
  placeholder = 'Tap to choose',
  valueLabel,
  disabled,
  loading,
  options,
  onSelect,
  onClear,
  modalTitle,
  searchPlaceholder = 'Search…',
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return options;
    }
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subtitle ?? '').toLowerCase().includes(q) ||
        (o.detail ?? '').toLowerCase().includes(q) ||
        o.id.includes(q),
    );
  }, [options, query]);

  const fieldStyle = {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    opacity: disabled ? 0.55 : 1,
  };

  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>{label}</Text>
      {hint ? (
        <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginBottom: 6 }}>{hint}</Text>
      ) : null}
      <Pressable
        disabled={disabled || loading}
        onPress={() => {
          setQuery('');
          setOpen(true);
        }}
        style={fieldStyle}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.accentTeal} />
        ) : (
          <Text
            style={{ ...outfit('regular', 14), color: valueLabel ? colors.textPrimary : colors.textMuted, flex: 1, marginRight: 8 }}
            numberOfLines={2}
          >
            {valueLabel || placeholder}
          </Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {valueLabel && onClear && !disabled ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onClear();
              }}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setOpen(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              maxHeight: '88%',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>{modalTitle ?? label}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 0.5,
                borderColor: colors.borderSubtle,
                borderRadius: 12,
                backgroundColor: colors.pageBg,
                paddingHorizontal: 12,
                marginBottom: 12,
              }}
            >
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={colors.textMuted}
                autoCorrect={false}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  ...outfit('regular', 15),
                  color: colors.textPrimary,
                }}
              />
            </View>
            <FlatList
              style={{ maxHeight: 400 }}
              data={filtered}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                  style={{
                    paddingVertical: 14,
                    borderBottomWidth: 0.5,
                    borderBottomColor: colors.borderSubtle,
                  }}
                >
                  <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>{item.label}</Text>
                  {item.subtitle ? (
                    <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 4 }}>{item.subtitle}</Text>
                  ) : null}
                  {item.detail ? (
                    <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 4 }} numberOfLines={3}>
                      {item.detail}
                    </Text>
                  ) : null}
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, paddingVertical: 20, textAlign: 'center' }}>
                  No matches found.
                </Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View
      style={{
        marginBottom: 16,
        borderRadius: 14,
        backgroundColor: colors.surface,
        borderWidth: 0.5,
        borderColor: colors.borderSubtle,
        overflow: 'hidden',
      }}
    >
      <View style={{ backgroundColor: colors.pageBg, paddingHorizontal: 14, paddingVertical: 10 }}>
        <Text style={{ ...outfit('medium', 11), color: colors.textMuted, letterSpacing: 0.66, textTransform: 'uppercase' }}>
          {title}
        </Text>
      </View>
      <View style={{ padding: 14 }}>{children}</View>
    </View>
  );
}

function ReadonlyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>{label}</Text>
      <View
        style={{
          backgroundColor: colors.pageBg,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 11,
          borderWidth: 0.5,
          borderColor: colors.borderSubtle,
        }}
      >
        <Text style={{ ...outfit('regular', 14), color: colors.textPrimary }}>{value || '—'}</Text>
      </View>
      {hint ? <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 4 }}>{hint}</Text> : null}
    </View>
  );
}

export { FormSection, ReadonlyField };
