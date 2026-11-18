import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { type, space, radius, gradients } from '../theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { DecorativeBackground } from './DecorativeBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

  const bgColor = variant === 'primary' ? palette.primary
    : variant === 'immersive' ? palette.surface
    : palette.surface;

  const textColor = variant === 'primary' ? palette.onPrimary : palette.text;
  const showBorder = variant === 'default' || variant === 'primary';

  return (
    <View style={[
      styles.bar,
      { paddingTop: Math.max(insets.top, 24) + 12, paddingBottom: 12 },
      variant !== 'primary' && { backgroundColor: bgColor },
      showBorder && { borderBottomWidth: 1, borderBottomColor: palette.border },
      variant === 'immersive' && styles.elevation,
      variant === 'immersive' && { shadowColor: palette.border },
    ]}>
      {variant === 'primary' && (
        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
          <Image 
            source={require('../../assets/images/home-header-bg.png')}
            style={{ position: 'absolute', width: '100%', height: 700, bottom: 0 }}
            resizeMode="cover"
          />
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.1)']} style={StyleSheet.absoluteFill} start={{x: 0, y: 0}} end={{x: 0, y: 1}} />
        </View>
      )}
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
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.screenPadding, minHeight: 52 },
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
