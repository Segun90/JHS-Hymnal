import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, PartyPopper, BookOpen, Check } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';
import { space, radius, fonts } from '@/theme/tokens';

export default function DevotionalCompleteScreen() {
  const { palette } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.root, { backgroundColor: palette.primary }]}>
      <View style={styles.closeWrap}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <ChevronLeft size={20} color={palette.onPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeInUp.delay(80)} style={styles.celebrateWrap}>
          <View style={[styles.celebrateCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <PartyPopper size={44} color={palette.onPrimary} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)} style={styles.centerBlock}>
          <Text style={[styles.eyebrow, { color: palette.onPrimary }]}>DAILY DEVOTIONAL</Text>
          <Text style={[styles.title, { color: palette.onPrimary }]}>Congratulations!</Text>
          <Text style={[styles.subtitle, { color: palette.onPrimary, opacity: 0.9 }]}>
            You have completed all currently available devotionals.{'\n\n'}
            Thank you for walking daily with God's Word. Please watch for future devotional updates.
          </Text>

          <View style={styles.featureRow}>
            <Feature icon={<Check size={16} color={palette.onPrimary} />} label="Journey complete" />
            <Feature icon={<BookOpen size={16} color={palette.onPrimary} />} label="Continue in the Bible" />
          </View>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(400)} style={styles.bottom}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/devotions')}
          style={[styles.cta, { backgroundColor: palette.onPrimary }]}
          activeOpacity={0.9}
        >
          <Text style={[styles.ctaText, { color: palette.primary }]}>Back to Devotions</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  const { palette } = useTheme();
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>{icon}</View>
      <Text style={[styles.featureLabel, { color: palette.onPrimary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeWrap: {
    position: 'absolute', top: 56, left: space.screenPadding, zIndex: 10,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1, paddingHorizontal: space.screenPadding, justifyContent: 'center' },
  celebrateWrap: { alignItems: 'center', marginBottom: 24 },
  celebrateCircle: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  centerBlock: { alignItems: 'center' },
  eyebrow: {
    fontFamily: fonts.sansBold, fontSize: 12, letterSpacing: 2,
    textTransform: 'uppercase', opacity: 0.85,
  },
  title: {
    fontFamily: fonts.serifBold, fontSize: 30, lineHeight: 38,
    textAlign: 'center', marginTop: 10,
  },
  subtitle: {
    fontFamily: fonts.sansRegular, fontSize: 14, lineHeight: 22,
    textAlign: 'center', marginTop: 14, maxWidth: 320,
  },
  featureRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 32, paddingHorizontal: 8, width: '100%',
  },
  featureItem: { alignItems: 'center', width: 120 },
  featureIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  featureLabel: { fontFamily: fonts.sansMedium, fontSize: 11, marginTop: 8, textAlign: 'center' },
  bottom: { paddingHorizontal: space.screenPadding, paddingBottom: 44 },
  cta: {
    height: 56, borderRadius: radius.rFull,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
});
