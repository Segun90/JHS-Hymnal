import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, G } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

interface DecorativeBackgroundProps {
  variant?: 'waves' | 'glow' | 'rays';
  opacity?: number;
  color?: string;
  inverse?: boolean;
}

export function DecorativeBackground({ 
  variant = 'waves', 
  opacity = 0.05, 
  color,
  inverse = false,
}: DecorativeBackgroundProps) {
  const { palette, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  
  // Use provided color or default to onPrimary if inverse, else text/primary
  const baseColor = color || (inverse ? palette.onPrimary : palette.primary);

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={baseColor} stopOpacity="1" />
            <Stop offset="1" stopColor={baseColor} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="glowGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor={baseColor} stopOpacity="1" />
            <Stop offset="1" stopColor={baseColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        
        {variant === 'waves' && (
          <G opacity={opacity}>
            <Path 
              d="M0,30 C30,40 70,10 100,20 L100,0 L0,0 Z" 
              fill="url(#grad)" 
            />
            <Path 
              d="M0,50 C40,20 60,60 100,40 L100,0 L0,0 Z" 
              fill="url(#grad)" 
              opacity="0.6"
            />
          </G>
        )}

        {variant === 'glow' && (
          <G opacity={opacity * 1.5}>
            <Circle cx="50" cy="0" r="80" fill="url(#glowGrad)" />
            <Circle cx="80" cy="-20" r="60" fill="url(#glowGrad)" opacity="0.6" />
          </G>
        )}

        {variant === 'rays' && (
          <G opacity={opacity}>
            <Path d="M50,-20 L20,100 L30,100 Z" fill="url(#grad)" />
            <Path d="M50,-20 L45,100 L55,100 Z" fill="url(#grad)" />
            <Path d="M50,-20 L80,100 L70,100 Z" fill="url(#grad)" />
            <Circle cx="50" cy="-20" r="40" fill="url(#grad)" />
          </G>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
});
