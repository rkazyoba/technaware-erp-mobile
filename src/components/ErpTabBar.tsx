import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Fragment } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './AppTypography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';

type ErpTabBarProps = BottomTabBarProps & {
  onFabPress: () => void;
};

const TAB_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  Home: { label: 'Home', icon: 'home-outline' },
  Modules: { label: 'Modules', icon: 'grid-outline' },
  Payslip: { label: 'Payslip', icon: 'document-text-outline' },
  Reports: { label: 'Reports', icon: 'stats-chart-outline' },
};

export function ErpTabBar({ state, navigation, onFabPress }: ErpTabBarProps) {
  const insets = useSafeAreaInsets();
  const currentName = state.routes[state.index]?.name;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(0,0,0,0.08)',
        paddingBottom: insets.bottom > 0 ? insets.bottom : 14,
        paddingTop: 8,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
      }}
    >
      {state.routes.map((route) => {
        const isFocused = currentName === route.name;
        const meta = TAB_META[route.name] ?? { label: route.name, icon: 'ellipse-outline' as const };
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        };

        return (
          <Fragment key={route.key}>
            <Pressable onPress={onPress} style={{ alignItems: 'center', minWidth: 56, paddingVertical: 4 }}>
              <Ionicons name={meta.icon} size={22} color={isFocused ? colors.primaryNavy : colors.textMuted} />
              <Text style={{ ...outfit('medium', 10), marginTop: 2, color: isFocused ? colors.primaryNavy : colors.textMuted }}>
                {meta.label}
              </Text>
              {isFocused ? (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accentTeal, marginTop: 4 }} />
              ) : (
                <View style={{ height: 4, marginTop: 4 }} />
              )}
            </Pressable>
            {route.name === 'Modules' ? (
              <Pressable
                onPress={onFabPress}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.accentTeal,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginHorizontal: 10,
                  marginBottom: 10,
                  borderWidth: 3,
                  borderColor: colors.surface,
                  top: -18,
                }}
              >
                <Ionicons name="add" size={26} color="#fff" />
              </Pressable>
            ) : null}
          </Fragment>
        );
      })}
    </View>
  );
}
