import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { type, space } from '../theme/tokens';
import { DecorativeBackground } from './DecorativeBackground';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  hint: string;
}

export function EmptyState({ icon, title, hint }: EmptyStateProps) {
  const { palette } = useTheme();
  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <DecorativeBackground variant="glow" opacity={0.1} />
      </View>
      <Animated.View entering={FadeInUp.duration(600).springify().damping(16)} style={{ alignItems: 'center', paddingHorizontal: space.screenPadding }}>
        <View style={{ opacity: 0.5 }}>{icon}</View>
        <Text style={[type.titleMedium, { color: palette.text, marginTop: space.space3, textAlign: 'center' }]}>{title}</Text>
        <Text style={[type.caption, { color: palette.textSecondary, marginTop: space.space1, textAlign: 'center' }]}>{hint}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: space.space7,
  },
});
