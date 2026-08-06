import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { radius, space, fonts } from '../theme/tokens';

interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  style?: any;
}

export function SegmentedControl({ segments, selectedIndex, onSelect, style }: SegmentedControlProps) {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();

  const margin = style?.width ? 0 : space.screenPadding;
  const padding = 3;
  const containerWidth = style?.width || (width - margin * 2);
  const segmentWidth = (containerWidth - (padding * 2)) / segments.length;

  const translateX = useSharedValue(selectedIndex * segmentWidth);

  useEffect(() => {
    translateX.value = withTiming(selectedIndex * segmentWidth, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [selectedIndex, segmentWidth, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: segmentWidth,
  }));

  return (
    <View style={[
      styles.container,
      { backgroundColor: palette.surfaceAlt, marginHorizontal: margin, padding },
      style,
    ]}>
      <Animated.View style={[
        styles.activeIndicator,
        { backgroundColor: palette.surface },
        animatedStyle,
      ]} />
      {segments.map((seg, i) => {
        const isSelected = i === selectedIndex;
        return (
          <TouchableOpacity
            key={i}
            onPress={() => onSelect(i)}
            accessibilityLabel={seg}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            style={styles.segment}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.segmentText,
              { color: isSelected ? palette.primary : palette.textSecondary },
            ]}>
              {seg}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.rFull,
    marginVertical: space.space3,
    height: 36,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: radius.rFull,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11.5,
  },
});
