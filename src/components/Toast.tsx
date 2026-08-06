import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { space, radius } from '../theme/tokens';

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
}

export function Toast({ message, visible, onDismiss }: ToastProps) {
  const { palette } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: palette.text, opacity },
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.text, { color: palette.background }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: 18, left: 0, right: 0,
    alignSelf: 'center', paddingHorizontal: space.space5,
    paddingVertical: space.space2, borderRadius: radius.rFull,
    marginHorizontal: 40,
  },
  text: { fontSize: 11, textAlign: 'center', fontWeight: '500' },
});
