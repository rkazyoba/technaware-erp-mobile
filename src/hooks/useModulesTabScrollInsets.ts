import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Tab bar row height excluding device home-indicator inset (see ErpTabBar). */
const TAB_BAR_BODY = 72;

/**
 * Scroll / keyboard offsets for stack screens shown above the signed-in bottom tabs.
 */
export function useModulesTabScrollInsets() {
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = insets.bottom + TAB_BAR_BODY + 40;
  const keyboardVerticalOffset = insets.top + 56;

  return {
    insets,
    scrollBottomPadding,
    keyboardVerticalOffset,
  };
}
