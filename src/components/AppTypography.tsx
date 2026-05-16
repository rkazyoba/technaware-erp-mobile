import React from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';
import { fontFamilies } from '../constants/typography';

/** Prepended to every `Text` / `TextInput` so Outfit applies under Fabric (defaultProps is unreliable). */
const outfitBase = { fontFamily: fontFamilies.regular };

export const Text = React.forwardRef<RNText, TextProps>(function AppText({ style, ...rest }, ref) {
  return <RNText ref={ref} {...rest} style={[outfitBase, style]} />;
});

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(function AppTextInput(
  { style, ...rest },
  ref,
) {
  return <RNTextInput ref={ref} {...rest} style={[outfitBase, style]} />;
});
