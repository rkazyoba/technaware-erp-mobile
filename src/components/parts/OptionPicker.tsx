import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from '../AppTypography';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import type { PickerOption } from '../../api';

type Props = {
  label: string;
  options: PickerOption[];
  valueId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
};

export function OptionPicker({ label, options, valueId, onSelect, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const selected = options.find((o) => o.id === valueId);
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return options;
    }
    return options.filter((o) => o.label.toLowerCase().includes(q) || (o.code ?? '').toLowerCase().includes(q));
  }, [filter, options]);

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>{label}</Text>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 0.5,
          borderColor: colors.borderSubtle,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 12,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Text style={{ ...outfit('regular', 14), color: selected ? colors.textPrimary : colors.textMuted }}>
          {selected?.label ?? 'Tap to select…'}
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '70%', backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
            <Text style={{ ...outfit('medium', 16), color: colors.textPrimary, marginBottom: 10 }}>{label}</Text>
            <TextInput
              value={filter}
              onChangeText={setFilter}
              placeholder="Search…"
              placeholderTextColor={colors.textMuted}
              style={{
                borderWidth: 0.5,
                borderColor: colors.borderSubtle,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 10,
                color: colors.textPrimary,
              }}
            />
            <ScrollView>
              {filtered.map((o) => (
                <Pressable
                  key={o.id}
                  onPress={() => {
                    onSelect(o.id);
                    setOpen(false);
                    setFilter('');
                  }}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 0.5,
                    borderBottomColor: colors.borderSubtle,
                    backgroundColor: o.id === valueId ? colors.pageBg : 'transparent',
                  }}
                >
                  <Text style={{ ...outfit('regular', 14), color: colors.textPrimary }}>{o.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
