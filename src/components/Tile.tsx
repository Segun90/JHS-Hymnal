import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { type, space, radius, elevation, gradients } from '../theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

interface TileProps {
  icon: React.ReactNode;
  label: string;
  caption: string;
  onPress: () => void;
}

export function Tile({ icon, label, caption, onPress }: TileProps) {
  const { palette, isDark } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={`${label} - ${caption}`}
      accessibilityRole="button"
      style={[styles.tile, elevation.card, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderWidth: 1, overflow: 'hidden' }]}
      activeOpacity={0.7}
    >
      <LinearGradient 
        colors={isDark ? gradients.surfaceSoftDark : gradients.surfaceSoftLight} 
        style={StyleSheet.absoluteFill} 
        start={{x: 0, y: 0}} end={{x: 0, y: 1}} 
      />
      <View style={{ zIndex: 1, gap: space.space2 }}>
        {icon}
        <Text style={[type.bodyStrong, { color: palette.text }]}>{label}</Text>
        <Text style={[type.caption, { color: palette.textSecondary }]}>{caption}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.r2,
    padding: space.space4,
    minHeight: 100,
  },
});
