import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { type, space } from '../theme/tokens';

interface SectionHeaderProps {
  title: string;
  count?: number;
}

export function SectionHeader({ title, count }: SectionHeaderProps) {
  const { palette } = useTheme();
  return (
    <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
      <Text style={[type.titleMedium, { color: palette.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 10.5 }]}>
        {title}
      </Text>
      {count !== undefined && (
        <Text style={[type.caption, { color: palette.textSecondary }]}>{count} hymns</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: space.space4, paddingVertical: space.space2,
    borderBottomWidth: 1,
  },
});
