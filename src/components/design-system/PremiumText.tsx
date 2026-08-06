import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { type as typographyTokens } from '../../theme/tokens';

interface PremiumTextProps extends TextProps {
  variant?: keyof typeof typographyTokens;
  color?: 'primary' | 'secondary' | 'accent' | 'error' | 'success';
  style?: TextStyle | TextStyle[];
}

export function PremiumText({ variant = 'body', color = 'primary', style, ...props }: PremiumTextProps) {
  const { palette } = useTheme();

  let textColor = palette.text;
  if (color === 'secondary') textColor = palette.textSecondary;
  if (color === 'accent') textColor = palette.accent;
  if (color === 'error') textColor = palette.error;
  if (color === 'success') textColor = palette.success;

  return (
    <Text
      style={[
        typographyTokens[variant],
        { color: textColor },
        style,
      ]}
      {...props}
    />
  );
}
