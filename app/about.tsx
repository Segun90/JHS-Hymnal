import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { space, fonts } from '@/theme/tokens';
import { LogoMark } from '@/components/LogoMark';

export default function AboutScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={[styles.appbar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeft size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.appbarTitle, { color: palette.text }]}>About</Text>
      </View>
      <View style={styles.body}>
        <LogoMark size={96} />
        <Text style={[styles.title, { color: palette.text }]}>J.H.S Bible & Hymnal</Text>
        <Text style={[styles.desc, { color: palette.textSecondary }]}>
          Joint Heirs of Salvation{'\n'}International Crusade Ministry
        </Text>
        <Text style={[styles.yw, { color: palette.highlight }]}>You Are Welcome</Text>
        <Text style={[styles.version, { color: palette.textSecondary }]}>Version {version}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space.screenPadding, paddingTop: 56, paddingBottom: 10,
    borderBottomWidth: 1,
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  appbarTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, flex: 1 },
  body: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: space.space6, gap: 9,
  },
  title: { fontFamily: fonts.serifSemiBold, fontSize: 18 },
  desc: { fontFamily: fonts.sansMedium, fontSize: 10.5, textAlign: 'center', lineHeight: 16, maxWidth: 220 },
  yw: { fontFamily: fonts.serifSemiBold, fontStyle: 'italic', fontSize: 13.5, marginTop: 4 },
  version: { fontFamily: fonts.sansMedium, fontSize: 10, marginTop: 14 },
});
