import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { type, space, radius } from '../theme/tokens';

interface PlaceholderCardProps {
  icon: React.ReactNode;
  label: string;
}

export function PlaceholderCard({ icon, label }: PlaceholderCardProps) {
  const { palette } = useTheme();
  return (
    <View style={[styles.card, { borderColor: palette.border }]}>
      <View style={{ opacity: 0.5 }}>{icon}</View>
      <Text style={[type.caption, { color: palette.textSecondary, textAlign: 'center' }]}>{label}</Text>
      <View style={[styles.badge, { backgroundColor: palette.surfaceAlt }]}>
        <Text style={[styles.badgeText, { color: palette.highlight }]}>SOON</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, borderWidth: 1.5, borderStyle: 'dashed',
    borderRadius: radius.r2, padding: space.space3,
    alignItems: 'center', gap: space.space2,
  },
  badge: {
    borderRadius: radius.rFull, paddingHorizontal: space.space2,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 8, fontWeight: '700' },
});
