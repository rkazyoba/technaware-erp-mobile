import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './AppTypography';
import { colors } from '../constants/colors';

export type FilterChip = { key: string; label: string };

type FilterChipsProps = {
  items: FilterChip[];
  activeKey: string;
  onChange: (key: string) => void;
};

export function FilterChips({ items, activeKey, onChange }: FilterChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
      {items.map((c) => {
        const active = c.key === activeKey;
        return (
          <Pressable
            key={c.key}
            onPress={() => onChange(c.key)}
            style={{
              backgroundColor: active ? colors.primaryNavy : colors.surface,
              borderWidth: 0.5,
              borderColor: active ? colors.primaryNavy : colors.borderSubtle,
              borderRadius: 20,
              paddingVertical: 6,
              paddingHorizontal: 12,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '500', color: active ? '#fff' : colors.textSecondary }}>{c.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
