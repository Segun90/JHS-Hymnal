import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Sunrise, BookOpen, PencilLine, Calendar as CalendarIcon, Share2, X } from 'lucide-react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';
import { space, radius, fonts, type } from '@/theme/tokens';
import { useDevotionsStore } from '@/stores/useDevotionsStore';

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DevotionalWelcomeScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const todayDay = useDevotionsStore((s) => s.todayDay);

  const greeting = useMemo(timeOfDay, []);

  return (
    <View style={[styles.root, { backgroundColor: palette.primary }]}>
      <View style={styles.closeWrap}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <X size={20} color={palette.onPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeInUp.delay(80)} style={styles.sunWrap}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)} style={styles.centerBlock}>
          <Text style={[styles.eyebrow, { color: palette.onPrimary }]}>DAILY DEVOTIONAL</Text>
          <Text style={[styles.title, { color: palette.onPrimary }]}>
            {greeting}{'\n'}Welcome to today's time{'\n'}in God's presence.
          </Text>
          <Text style={[styles.subtitle, { color: palette.onPrimary, opacity: 0.85 }]}>
            Today's devotional is ready for you.{'\n'}May the Holy Spirit speak to your heart.
          </Text>

          <View style={styles.verseCard}>
            <Text style={[styles.verseText, { color: palette.onPrimary }]}>
              "The entrance of thy words giveth light; it giveth understanding unto the simple."
            </Text>
            <Text style={[styles.verseRef, { color: palette.onPrimary, opacity: 0.8 }]}>Psalm 119:130 · KJV</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(400)} style={styles.featureRow}>
          <Feature icon={<BookOpen size={18} color={palette.onPrimary} />} label="Daily reading" />
          <Feature icon={<PencilLine size={18} color={palette.onPrimary} />} label="Take notes" />
          <Feature icon={<Share2 size={18} color={palette.onPrimary} />} label="Share" />
          <Feature icon={<CalendarIcon size={18} color={palette.onPrimary} />} label="Calendar" />
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(500)} style={styles.bottom}>
        <TouchableOpacity
          onPress={() => (todayDay ? router.replace(`/devotional/${todayDay}`) : router.replace('/devotional/complete'))}
          style={[styles.cta, { backgroundColor: palette.onPrimary }]}
          activeOpacity={0.9}
        >
          <Sunrise size={20} color={palette.primary} />
          <Text style={[styles.ctaText, { color: palette.primary }]}>
            {todayDay ? 'Begin Reading' : 'View Completion'}
          </Text>
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
    position: 'absolute', top: 56, right: space.screenPadding, zIndex: 10,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1, paddingHorizontal: space.screenPadding, justifyContent: 'center' },
  sunWrap: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 88, height: 88 },
  centerBlock: { alignItems: 'center' },
  eyebrow: {
    fontFamily: fonts.sansBold, fontSize: 12, letterSpacing: 2,
    textTransform: 'uppercase', opacity: 0.85,
  },
  title: {
    fontFamily: fonts.serifBold, fontSize: 26, lineHeight: 34,
    textAlign: 'center', marginTop: 10,
  },
  subtitle: { fontFamily: fonts.sansMedium, fontSize: 13, marginTop: 12 },
  verseCard: {
    marginTop: 28, padding: space.space5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: radius.r3,
    width: '100%',
  },
  verseText: {
    fontFamily: fonts.serifRegular, fontStyle: 'italic',
    fontSize: 15, lineHeight: 24, textAlign: 'center',
  },
  verseRef: { fontFamily: fonts.sansMedium, fontSize: 11, textAlign: 'center', marginTop: 10 },
  featureRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 32, paddingHorizontal: 4,
  },
  featureItem: { alignItems: 'center', width: 70 },
  featureIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  featureLabel: { fontFamily: fonts.sansMedium, fontSize: 10, marginTop: 8, textAlign: 'center' },
  bottom: { paddingHorizontal: space.screenPadding, paddingBottom: 44 },
  cta: {
    height: 56, borderRadius: radius.rFull,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
});
