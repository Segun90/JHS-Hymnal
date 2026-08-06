import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { radius, space, elevation } from '../../theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PremiumCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  interactive?: boolean;
}

export function PremiumCard({ children, onPress, style, interactive = true }: PremiumCardProps) {
  const { palette } = useTheme();
  const scale = useSharedValue(1);
  const elev = useSharedValue(2);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      elevation: elev.value,
      shadowOpacity: withTiming(scale.value < 1 ? 0.15 : 0.05, { duration: 250 }),
    };
  });

  const handlePressIn = () => {
    if (!interactive) return;
    scale.value = withTiming(0.97, { duration: 200, easing: Easing.out(Easing.cubic) });
    elev.value = withTiming(6, { duration: 200 });
  };

  const handlePressOut = () => {
    if (!interactive) return;
    scale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    elev.value = withTiming(2, { duration: 200 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: palette.surface, shadowColor: palette.border },
        interactive && animatedStyle,
        style,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.r2,
    padding: space.space5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
});
