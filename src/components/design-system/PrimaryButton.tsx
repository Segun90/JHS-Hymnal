import React from 'react';
import { Pressable, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { radius, space, elevation } from '../../theme/tokens';
import { PremiumText } from './PremiumText';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function PrimaryButton({ label, onPress, loading, disabled, icon, style }: PrimaryButtonProps) {
  const { palette } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: withTiming(disabled ? 0.6 : 1, { duration: 200 }),
  }));

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withTiming(0.96, { duration: 150 });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    scale.value = withTiming(1, { duration: 150 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: palette.primary, shadowColor: palette.primary },
        animatedStyle,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.onPrimary} />
      ) : (
        <>
          {icon}
          <PremiumText variant="bodyStrong" style={{ color: palette.onPrimary, marginLeft: icon ? space.space2 : 0 }}>
            {label}
          </PremiumText>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: radius.rFull,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.space6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  }
});
