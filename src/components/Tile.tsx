import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { type, space, radius } from '../theme/tokens';

interface TileProps {
  icon: React.ReactNode;
  label: string;
  caption: string;
  onPress: () => void;
}

export function Tile({ icon, label, caption, onPress }: TileProps) {
  const { palette } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={`${label} - ${caption}`}
      accessibilityRole="button"
      style={[styles.tile, { backgroundColor: palette.surfaceAlt }]}
      activeOpacity={0.7}
    >
      {icon}
      <Text style={[type.bodyStrong, { color: palette.text }]}>{label}</Text>
      <Text style={[type.caption, { color: palette.textSecondary }]}>{caption}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.r2,
    padding: space.space4,
    gap: space.space2,
    minHeight: 100,
  },
});
