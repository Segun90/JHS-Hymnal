import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { type, space } from '../theme/tokens';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  hint: string;
}

export function EmptyState({ icon, title, hint }: EmptyStateProps) {
  const { palette } = useTheme();
  return (
    <View style={styles.container}>
      <View style={{ opacity: 0.5 }}>{icon}</View>
      <Text style={[type.titleMedium, { color: palette.text, marginTop: space.space3 }]}>{title}</Text>
      <Text style={[type.caption, { color: palette.textSecondary, marginTop: space.space1 }]}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: space.space7,
  },
});
