import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, tabBar } from '@/theme/tokens';

const TAB_BAR_HEIGHT = tabBar.contentHeight + tabBar.padding * 2;

const CONTENT_GAP = space.space4;

export function useTabBarClearance(): number {
  const insets = useSafeAreaInsets();
  return (
    Math.max(insets.bottom, tabBar.minBottomInset) +
    tabBar.bottomGap +
    TAB_BAR_HEIGHT +
    CONTENT_GAP
  );
}

export function useScreenClearance(): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + CONTENT_GAP;
}
