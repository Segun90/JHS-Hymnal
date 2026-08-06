import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { type, space, radius } from '../theme/tokens';

interface BookListItemProps {
  abbreviation: string;
  name: string;
  chapterCount: number; // Kept to avoid breaking parent passing this prop
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BookListItem({ abbreviation, name, chapterCount, onPress }: BookListItemProps) {
  const { palette } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      shadowOpacity: withTiming(scale.value < 1 ? 0.12 : 0.04, { duration: 250, easing: Easing.out(Easing.cubic) }),
    };
  });

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 250, easing: Easing.out(Easing.cubic) });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={`${name}`}
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          shadowColor: palette.border,
        },
        animatedStyle
      ]}
    >
      <View style={[styles.abbrevPill, { backgroundColor: palette.background }]}>
        <Text style={[type.bodyStrong, { color: palette.text, fontSize: 14 }]}>{abbreviation}</Text>
      </View>
      <View style={styles.grow}>
        <Text style={[type.titleMedium, { color: palette.text }]}>{name}</Text>
        <Text style={[type.caption, { color: palette.textSecondary, marginTop: 2 }]}>KJV Bible</Text>
      </View>
      <ChevronRight size={20} color={palette.textSecondary} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.space5, // 20px
    marginHorizontal: space.screenPadding,
    marginBottom: space.space3, // 12px space between cards
    borderRadius: radius.r3, // 20px
    // Default Soft shadow
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 3,
  },
  abbrevPill: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: radius.rFull,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.space4,
  },
  grow: {
    flex: 1,
  },
});
