import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Hash, Delete, Check } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { fonts, space, radius } from '../theme/tokens';
import { getHymnBounds, hymnNumberExists } from '../db/hymns';

interface NumberPadProps {
  onGo: (number: number) => void;
}

export function NumberPad({ onGo }: NumberPadProps) {
  const { palette } = useTheme();
  const [value, setValue] = useState('');
  const bounds = useMemo(() => getHymnBounds(), []);
  const maxDigits = Math.max(3, String(bounds.maxNumber || 375).length);

  const handlePress = (key: string) => {
    if (key === 'back') {
      setValue(value.slice(0, -1));
    } else if (key === 'go') {
      const num = parseInt(value, 10);
      if (
        Number.isFinite(num) &&
        num >= bounds.minNumber &&
        num <= bounds.maxNumber &&
        hymnNumberExists(num)
      ) {
        onGo(num);
        setValue('');
      }
    } else {
      if (value.length < maxDigits) {
        setValue(value + key);
      }
    }
  };

  const parsed = parseInt(value, 10);
  const canGo =
    value.length >= 1 &&
    Number.isFinite(parsed) &&
    parsed >= bounds.minNumber &&
    parsed <= bounds.maxNumber;

  const keys: { label: string; icon?: 'back' | 'go' }[] = [
    { label: '1' }, { label: '2' }, { label: '3' },
    { label: '4' }, { label: '5' }, { label: '6' },
    { label: '7' }, { label: '8' }, { label: '9' },
    { label: '', icon: 'back' }, { label: '0' }, { label: '', icon: 'go' },
  ];

  return (
    <View style={[styles.card, { backgroundColor: palette.surface }]}>
      <View style={[styles.readout, { backgroundColor: palette.surfaceAlt }]}>
        <Hash size={18} color={palette.primary} />
        <Text style={[styles.readoutText, { color: palette.text }]}>
          {value || ' _'}
        </Text>
      </View>
      <View style={styles.pad}>
        {keys.map((key) => {
          const isBack = key.icon === 'back';
          const isGo = key.icon === 'go';

          return (
            <TouchableOpacity
              key={`${key.label}-${key.icon || ''}`}
              onPress={() => handlePress(isBack ? 'back' : isGo ? 'go' : key.label)}
              accessibilityLabel={isBack ? 'Backspace' : isGo ? 'Go' : `Digit ${key.label}`}
              activeOpacity={0.7}
              style={[
                styles.key,
                { backgroundColor: palette.surfaceAlt },
                isGo && canGo && { backgroundColor: palette.primary },
                isGo && !canGo && { opacity: 0.5 },
              ]}
            >
              {isBack ? (
                <Delete size={20} color={palette.textSecondary} />
              ) : isGo ? (
                <Check size={20} color={canGo ? palette.onPrimary : palette.textSecondary} />
              ) : (
                <Text style={[styles.keyText, { color: palette.text }]}>{key.label}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: space.screenPadding,
    marginVertical: space.space3,
    borderRadius: radius.r2,
    padding: space.space4,
  },
  readout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.space2,
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: space.space3,
    marginBottom: 10,
  },
  readoutText: {
    fontSize: 17,
    fontFamily: fonts.sansSemiBold,
    letterSpacing: 2,
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'center',
  },
  key: {
    width: '31%',
    aspectRatio: 1.6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 16,
    fontFamily: fonts.sansSemiBold,
  },
});
