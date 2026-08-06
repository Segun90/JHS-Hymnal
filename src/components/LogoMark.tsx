import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface LogoMarkProps {
  size?: number;
}

export function LogoMark({ size = 120 }: LogoMarkProps) {
  return (
    <Image
      source={require('../../assets/images/logo.png')}
      style={{ width: size, height: size, resizeMode: 'contain' }}
      accessibilityLabel="J.H.S Ministry Logo"
    />
  );
}
