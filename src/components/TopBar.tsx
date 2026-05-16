import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View, type ViewStyle } from 'react-native';
import { Text } from './AppTypography';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';

type IconButtonProps = {
  onPress: () => void;
  children: ReactNode;
};

function IconButton({ onPress, children }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </Pressable>
  );
}

type TopBarProps = {
  title?: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  style?: ViewStyle;
};

export function TopBar({ title, subtitle, left, right, style }: TopBarProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.primaryNavy,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        style,
      ]}
    >
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {left}
        {title ? (
          <View style={{ flex: 1 }}>
            <Text style={{ ...outfit('medium', 17), color: '#fff' }}>{title}</Text>
            {subtitle ? (
              <Text style={{ ...outfit('regular', 11), color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{subtitle}</Text>
            ) : null}
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
      </View>
      {right}
    </View>
  );
}

export function TopBarIconButton({
  name,
  onPress,
  color = '#fff',
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
}) {
  return (
    <IconButton onPress={onPress}>
      <Ionicons name={name} size={18} color={color} />
    </IconButton>
  );
}
