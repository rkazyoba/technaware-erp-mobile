import { Pressable, View } from 'react-native';
import { Text } from './AppTypography';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';

export type DetailTabId = string;

type TabDef = { id: DetailTabId; label: string };

type Props = {
  tabs: TabDef[];
  active: DetailTabId;
  onChange: (id: DetailTabId) => void;
};

export function DetailTabBar({ tabs, active, onChange }: Props) {
  if (tabs.length < 2) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 0.5,
        borderColor: colors.borderSubtle,
        padding: 4,
        marginBottom: 12,
      }}
    >
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <Pressable
            key={t.id}
            onPress={() => onChange(t.id)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 9,
              backgroundColor: on ? colors.primaryNavy : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ ...outfit('medium', 13), color: on ? '#fff' : colors.textSecondary }}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
