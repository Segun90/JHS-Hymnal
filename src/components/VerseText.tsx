import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/tokens';
import { space } from '../theme/tokens';

interface VerseTextProps {
  verseNumber: number;
  text: string;
  isSelected?: boolean;
  searchMatch?: boolean;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  onLongPress?: () => void;
}

export function VerseText({ verseNumber, text, isSelected, searchMatch, fontSize, lineHeight, letterSpacing, onLongPress }: VerseTextProps) {
  const { palette } = useTheme();
  const bodyLineHeight = Math.round(fontSize * lineHeight);

  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      delayLongPress={400}
      accessibilityLabel={`Verse ${verseNumber}: ${text}`}
      accessibilityRole="text"
      activeOpacity={0.8}
      style={[
        styles.verse,
        (isSelected || searchMatch) && { backgroundColor: palette.surfaceAlt },
      ]}
    >
      <Text
        style={[
          styles.body,
          {
            fontSize,
            lineHeight: bodyLineHeight,
            letterSpacing,
            color: palette.text,
          },
        ]}
      >
        <Text
          style={[
            styles.vn,
            {
              fontSize: 12,
              lineHeight: bodyLineHeight,
              color: palette.textSecondary,
            },
          ]}
        >
          {verseNumber}
        </Text>
        {' '}{text}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  verse: {
    marginBottom: space.readerParagraphGap,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: 4,
  },
  vn: {
    fontFamily: fonts.sansSemiBold,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fonts.serifRegular,
    textAlign: 'justify',
  },
});
