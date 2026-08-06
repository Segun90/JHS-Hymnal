import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { type, space, radius } from '../theme/tokens';

interface AppBarProps {
  title: string;
  variant?: 'default' | 'primary' | 'immersive';
  leading?: React.ReactNode;
  onBack?: () => void;
  trailing?: React.ReactNode;
  serif?: boolean;
}

export function AppBar({ title, variant = 'default', leading, onBack, trailing, serif }: AppBarProps) {
  const { palette, isDark } = useTheme();

  const bgColor = variant === 'primary' ? palette.primary
    : variant === 'immersive' ? palette.surface
    : palette.surface;

  const textColor = variant === 'primary' ? palette.onPrimary : palette.text;
  const showBorder = variant === 'default' || variant === 'primary';

  return (
    <View style={[
      styles.bar,
      { backgroundColor: bgColor },
      showBorder && { borderBottomWidth: 1, borderBottomColor: palette.border },
      variant === 'immersive' && styles.elevation,
      variant === 'immersive' && { shadowColor: palette.border },
    ]}>
      <View style={[styles.left, !onBack && !leading && { minWidth: 0 }]}>
        {onBack && (
          <TouchableOpacity onPress={onBack} accessibilityLabel="Go back" style={styles.iconBtn}>
            {leading || <ChevronLeft size={24} color={textColor} />}
          </TouchableOpacity>
        )}
      </View>
      <Text
        style={[
          serif ? { fontFamily: type.titleLarge.fontFamily, fontSize: 18, lineHeight: 24 } : { fontFamily: type.titleMedium.fontFamily, fontSize: 15, lineHeight: 20 },
          { color: textColor, flex: 1 },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={[styles.right, { minWidth: onBack ? 44 : 0 }]}>
        {trailing}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.screenPadding, minHeight: 52, paddingTop: 6, paddingBottom: 6 },
  elevation: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  left: { flexDirection: 'row', alignItems: 'center', minWidth: 44, marginRight: space.space2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: space.space1, minWidth: 44 },
  iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
});
