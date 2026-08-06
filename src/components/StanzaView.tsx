import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fonts, space } from '../theme/tokens';

interface StanzaViewProps {
  stanzaType: 'verse' | 'chorus';
  stanzaNumber: number;
  text: string;
  fontSize: number;
}

export function StanzaView({ stanzaType, stanzaNumber, text, fontSize }: StanzaViewProps) {
  const { palette } = useTheme();
  const isChorus = stanzaType === 'chorus';

  return (
    <View style={[styles.stanza, isChorus && styles.chorus]}>
      {!isChorus && (
        <Text style={[styles.sn, { color: palette.highlight }]}>
          {stanzaNumber}.
        </Text>
      )}
      {isChorus && (
        <Text style={[styles.sn, { color: palette.textSecondary }]}>
          Ch.
        </Text>
      )}
      <Text style={[
        styles.text,
        {
          fontSize,
          lineHeight: Math.round(fontSize * 1.7),
          color: isChorus ? palette.textSecondary : palette.text,
          fontStyle: isChorus ? 'italic' : 'normal',
        },
      ]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stanza: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: space.screenPadding,
  },
  chorus: {
    paddingLeft: 34,
  },
  sn: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    paddingTop: 2,
    flex: 0,
  },
  text: {
    fontFamily: fonts.serifRegular,
    flex: 1,
  },
});
