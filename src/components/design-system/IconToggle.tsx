import React, { useEffect } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface IconToggleProps {
  isActive: boolean;
  onToggle: () => void;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function IconToggle({ isActive, onToggle, activeIcon, inactiveIcon, style }: IconToggleProps) {
  const { palette } = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      scale.value = withSequence(
        withTiming(1.3, { duration: 150 }),
        withSpring(1, { damping: 12, stiffness: 150 })
      );
    } else {
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onToggle}
      style={[styles.container, style, animatedStyle]}
      hitSlop={8}
    >
      {isActive ? activeIcon : inactiveIcon}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
