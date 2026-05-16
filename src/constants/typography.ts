import type { TextStyle } from 'react-native';
import { colors } from './colors';

/** Loaded via `useFonts` in App — must match @expo-google-fonts/outfit exports. */
export const fontFamilies = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
} as const;

export type OutfitRole = keyof typeof fontFamilies;

/** Prefer explicit Outfit files over synthetic `fontWeight` on Android. */
export function outfit(role: OutfitRole, size: number, extra?: TextStyle): TextStyle {
  return {
    fontFamily: fontFamilies[role],
    fontSize: size,
    ...extra,
  };
}

export const typography = {
  heading: outfit('medium', 16, { color: colors.textPrimary }),
  body: outfit('regular', 14, { color: colors.textPrimary }),
  label: outfit('medium', 11, { color: colors.textMuted, letterSpacing: 0.66 }),
} as const;
