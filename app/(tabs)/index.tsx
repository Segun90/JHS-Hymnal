import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Image, Text, useWindowDimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Music, Search, Library, Settings, AudioLines, Cloud, BookMarked } from 'lucide-react-native';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing, runOnJS, cancelAnimation } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';
import { space, radius, fonts, gradients } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { useLibraryStore } from '@/stores/useLibraryStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDevotionsStore } from '@/stores/useDevotionsStore';
import { getVerse, getBook } from '@/db/bible';
import { getHymn } from '@/db/hymns';
import { formatBibleRef } from '@/utils/references';
import { useTabBarClearance } from '@/utils/layout';
import type { Verse } from '@/types';

const CAROUSEL_ITEMS = [
  { bookId: 43, chapter: 3, verse: 16, category: 'Love' },
  { bookId: 19, chapter: 23, verse: 1, category: 'Trust' },
  { bookId: 19, chapter: 150, verse: 6, category: 'Praise' },
  { bookId: 19, chapter: 100, verse: 2, category: 'Worship' },
  { bookId: 45, chapter: 12, verse: 1, category: 'Faith' },
  { bookId: 58, chapter: 13, verse: 15, category: 'Worship' },
  { bookId: 23, chapter: 40, verse: 31, category: 'Hope' },
  { bookId: 50, chapter: 4, verse: 13, category: 'Strength' },
];

const TILE_CONFIG = [
  { icon: BookOpen, label: 'Bible', sub: 'KJV \u00B7 Old & New Testament', route: '/(tabs)/bible' },
  { icon: Music, label: 'Hymns', sub: '376 hymns \u00B7 22 topics', route: '/(tabs)/hymns' },
  { icon: Search, label: 'Search', sub: 'Bible & hymnal', route: '/search' },
  { icon: Library, label: 'My Library', sub: 'Bookmarks \u00B7 notes', route: '/library' },
];

const CAROUSEL_INTERVAL = 6000;
const FADE_DURATION = 700;

export default function HomeScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const tabBarClearance = useTabBarClearance();
  const { width: screenWidth } = useWindowDimensions();
  const history = useLibraryStore((s: any) => s.history);
  const record = useLibraryStore((s: any) => s.record);
  const todayDevDay = useDevotionsStore((s) => s.todayDay);
  const devTotal = useDevotionsStore((s) => s.totalDays);
  const getDayDevotional = useDevotionsStore((s) => s.getDayDevotional);

  const todayDevotional = useMemo(() => {
    if (!todayDevDay) return null;
    return getDayDevotional(todayDevDay);
  }, [todayDevDay, getDayDevotional]);

  const cardGap = 10;
  const cardWidth = (screenWidth - space.screenPadding * 2 - cardGap) / 2;

  const continueItem = useMemo(() => {
    if (!history || history.length === 0) return null;
    return history[0];
  }, [history]);

  const continueInfo = useMemo(() => {
    if (!continueItem) return null;
    if (continueItem.itemType === 'bible' && continueItem.bibleRef) {
      const parts = continueItem.bibleRef.split(':');
      const bid = parseInt(parts[0], 10);
      const bk = getBook(bid);
      const chapLabel = parts.length >= 2 ? parts[1] : '';
      return {
        title: `${bk?.name ?? 'Book'} ${chapLabel}`,
        sub: parts.length >= 3 ? `Verse ${parts[2]}` : 'Chapter',
        route: `/bible/${parts[0]}/${parts[1]}`,
      };
    }
    if (continueItem.itemType === 'hymn' && continueItem.hymnId) {
      const h = getHymn(continueItem.hymnId);
      return {
        title: h?.title ?? `Hymn ${continueItem.hymnId}`,
        sub: `Hymn ${continueItem.hymnId}`,
        route: `/hymns/${continueItem.hymnId}`,
      };
    }
    return null;
  }, [continueItem]);

  const lastOpened = useMemo(() => {
    if (!continueItem?.viewedAt) return '';
    const d = new Date(continueItem.viewedAt);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [continueItem]);

  const [carouselVerses, setCarouselVerses] = useState<(Verse & { category: string })[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    const loaded: (Verse & { category: string })[] = [];
    for (const item of CAROUSEL_ITEMS) {
      const v = getVerse(item.bookId, item.chapter, item.verse);
      if (v) loaded.push({ ...v, category: item.category });
    }
    setCarouselVerses(loaded);
  }, []);

  const nextIdx = (carouselIdx + 1) % (carouselVerses.length || 1);
  const opacityOut = useSharedValue(0);
  const opacityIn = useSharedValue(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advanceCarousel = useCallback(() => {
    opacityOut.value = withTiming(0, { duration: FADE_DURATION, easing: Easing.inOut(Easing.ease) });
    opacityIn.value = withTiming(1, { duration: FADE_DURATION, easing: Easing.inOut(Easing.ease) }, () => {
      runOnJS(setCarouselIdx)((carouselIdx + 1) % (carouselVerses.length || 1));
      opacityOut.value = 0;
      opacityIn.value = 1;
    });
  }, [carouselIdx, carouselVerses.length]);

  useEffect(() => {
    if (carouselVerses.length === 0) return;
    intervalRef.current = setInterval(advanceCarousel, CAROUSEL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [advanceCarousel, carouselVerses.length]);

  const fadeOutStyle = useAnimatedStyle(() => ({ opacity: opacityOut.value }));
  const fadeInStyle = useAnimatedStyle(() => ({ opacity: opacityIn.value }));

  const currentVerse = carouselVerses[carouselIdx];
  const upcomingVerse = carouselVerses[nextIdx];

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={[styles.appbar, { backgroundColor: palette.primary }]}>
        <Image source={require('../../assets/logo.png')} style={styles.logoSmall} />
        <Text style={[styles.appbarTitle, { color: palette.onPrimary }]}>J.H.S</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.iconBtn}>
          <Settings size={22} color={palette.onPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: tabBarClearance }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.greeting, { color: palette.text }]}>You Are Welcome</Text>

        <View style={[styles.grid, { paddingHorizontal: space.screenPadding }]}>
          {TILE_CONFIG.map((tile, i) => {
            const Icon = tile.icon;
            return (
              <DashboardCard
                key={tile.label}
                width={cardWidth}
                icon={<Icon size={28} color={palette.primary} />}
                label={tile.label}
                sub={tile.sub}
                bg={palette.surfaceAlt}
                textColor={palette.text}
                subColor={palette.textSecondary}
                onPress={() => router.push(tile.route as any)}
              />
            );
          })}
        </View>

        {continueInfo ? (
          <TouchableOpacity
            style={[styles.contCard, { backgroundColor: palette.surface }]}
            onPress={() => {
              record(continueItem);
              router.push(continueInfo.route as any);
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.contIcon, { backgroundColor: palette.surfaceAlt }]}>
              <BookMarked size={18} color={palette.highlight} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.contTitle, { color: palette.text }]}>Continue Reading</Text>
              <Text style={[styles.contRef, { color: palette.highlight }]}>{continueInfo.title}</Text>
              <Text style={[styles.contSub, { color: palette.textSecondary }]}>
                {continueInfo.sub} · {lastOpened}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.contCard, { backgroundColor: palette.surface }]}
            onPress={() => router.push('/(tabs)/bible')}
            activeOpacity={0.8}
          >
            <View style={[styles.contIcon, { backgroundColor: palette.surfaceAlt }]}>
              <BookOpen size={18} color={palette.textSecondary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.contTitle, { color: palette.text }]}>Start Reading</Text>
              <Text style={[styles.contSub, { color: palette.textSecondary }]}>
                Open your first Bible chapter or Hymn
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.soonRow}>
          <View style={[styles.soonCard, { borderColor: palette.border }]}>
            <AudioLines size={20} color={palette.textSecondary} />
            <Text style={[styles.soonLabel, { color: palette.textSecondary }]}>Audio</Text>
            <Text style={[styles.soonBadge, { backgroundColor: palette.surfaceAlt, color: palette.highlight }]}>SOON</Text>
          </View>
          <View style={[styles.soonCard, { borderColor: palette.border }]}>
            <Cloud size={20} color={palette.textSecondary} />
            <Text style={[styles.soonLabel, { color: palette.textSecondary }]}>Sync</Text>
            <Text style={[styles.soonBadge, { backgroundColor: palette.surfaceAlt, color: palette.highlight }]}>SOON</Text>
          </View>
        </View>

        {todayDevotional ? (
          <TouchableOpacity
            style={styles.devCard}
            onPress={() => router.push(`/devotional/${todayDevDay}`)}
            activeOpacity={0.9}
          >
            <LinearGradient colors={gradients.hero} style={styles.devBg} />
            <View style={styles.devCardTop}>
              <View style={[styles.devDayPill, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <Text style={[styles.devDayText, { color: palette.onPrimary }]}>
                  TODAY'S DEVOTIONAL
                </Text>
              </View>
            </View>
            <Text style={[styles.devTitle, { color: palette.onPrimary }]}>{todayDevotional.title}</Text>
            <Text style={[styles.devScripture, { color: palette.onPrimary, opacity: 0.85 }]}>
              {todayDevotional.scripture}
            </Text>
            <Text style={[styles.devCta, { color: palette.onPrimary }]}>
              Read today's devotional →
            </Text>
          </TouchableOpacity>
        ) : devTotal > 0 ? (
          <TouchableOpacity
            style={styles.devCard}
            onPress={() => router.push('/devotional/complete')}
            activeOpacity={0.9}
          >
            <LinearGradient colors={gradients.hero} style={styles.devBg} />
            <View style={styles.devCardTop}>
              <View style={[styles.devDayPill, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <Text style={[styles.devDayText, { color: palette.onPrimary }]}>COMPLETE</Text>
              </View>
            </View>
            <Text style={[styles.devTitle, { color: palette.onPrimary }]}>Congratulations!</Text>
            <Text style={[styles.devScripture, { color: palette.onPrimary, opacity: 0.85 }]}>
              You have completed the devotional collection.
            </Text>
            <Text style={[styles.devCta, { color: palette.onPrimary }]}>View completion →</Text>
          </TouchableOpacity>
        ) : null}

        <View style={[styles.carouselWrap, { backgroundColor: palette.surface, borderLeftColor: palette.accent }]}>
          {currentVerse && upcomingVerse && (
            <View style={styles.carouselStack}>
              <Animated.View style={[StyleSheet.absoluteFill, fadeOutStyle]}>
                <Text style={[styles.votdQuote, { color: palette.text }]}>
                  "{currentVerse.text}"
                </Text>
                <Text style={[styles.votdCat, { color: palette.accent }]}>
                  {currentVerse.category}
                </Text>
                <Text style={[styles.votdRef, { color: palette.textSecondary }]}>
                  {formatBibleRef(`${currentVerse.bookId}:${currentVerse.chapter}:${currentVerse.verse}`)} · KJV
                </Text>
              </Animated.View>
              <Animated.View style={fadeInStyle}>
                <Text style={[styles.votdQuote, { color: palette.text }]}>
                  "{upcomingVerse.text}"
                </Text>
                <Text style={[styles.votdCat, { color: palette.accent }]}>
                  {upcomingVerse.category}
                </Text>
                <Text style={[styles.votdRef, { color: palette.textSecondary }]}>
                  {formatBibleRef(`${upcomingVerse.bookId}:${upcomingVerse.chapter}:${upcomingVerse.verse}`)} · KJV
                </Text>
              </Animated.View>
            </View>
          )}
          <View style={styles.carouselDots}>
            {carouselVerses.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: palette.border },
                  i === carouselIdx && { backgroundColor: palette.highlight, width: 16 },
                ]}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function DashboardCard({ width, icon, label, sub, bg, textColor, subColor, onPress }: any) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ width }, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 18, stiffness: 200 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 180 }); }}
        style={[styles.tile, { backgroundColor: bg }]}
      >
        {icon}
        <Text style={[styles.tileTitle, { color: textColor }]}>{label}</Text>
        <Text style={[styles.tileSub, { color: subColor }]}>{sub}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  appbar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: space.screenPadding, paddingTop: 56, paddingBottom: 12,
  },
  logoSmall: { width: 26, height: 26 },
  appbarTitle: { fontFamily: fonts.sansSemiBold, fontSize: 18 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  greeting: {
    fontFamily: fonts.serifSemiBold, fontSize: 20,
    paddingHorizontal: space.screenPadding, paddingVertical: 16,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, justifyContent: 'center',
  },
  tile: {
    borderRadius: radius.r2, padding: space.space4,
    gap: space.space2,
  },
  tileTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, marginTop: space.space1 },
  tileSub: { fontFamily: fonts.sansMedium, fontSize: 11, lineHeight: 14 },
  contCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: space.screenPadding, marginTop: 16, marginBottom: 4,
    borderRadius: radius.r2, padding: space.space4,
  },
  contIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  contTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13.5 },
  contRef: { fontFamily: fonts.serifSemiBold, fontSize: 14, marginTop: 1 },
  contSub: { fontFamily: fonts.sansMedium, fontSize: 11, marginTop: 1 },
  soonRow: {
    flexDirection: 'row', gap: space.space2,
    paddingHorizontal: space.screenPadding, marginTop: 18, marginBottom: 4,
  },
  devCard: {
    marginHorizontal: space.screenPadding, marginTop: 14,
    borderRadius: radius.r3, padding: space.space5, overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 4,
  },
  devBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: radius.r3,
  },
  devCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  devDayPill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.rFull, paddingHorizontal: 12, paddingVertical: 5,
  },
  devDayText: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.6 },
  devTitle: { fontFamily: fonts.serifBold, fontSize: 20, lineHeight: 27, marginTop: 14 },
  devScripture: { fontFamily: fonts.sansMedium, fontSize: 12.5, marginTop: 6 },
  devCta: { fontFamily: fonts.sansSemiBold, fontSize: 13, marginTop: 16 },
  soonCard: {
    flex: 1, borderWidth: 1.5, borderStyle: 'dashed',
    borderRadius: radius.r2, padding: space.space3,
    alignItems: 'center', gap: space.space1,
  },
  soonLabel: { fontFamily: fonts.sansMedium, fontSize: 10 },
  soonBadge: {
    fontFamily: fonts.sansBold, fontSize: 8,
    borderRadius: radius.rFull, paddingHorizontal: 7, paddingVertical: 2,
    overflow: 'hidden',
  },
  carouselWrap: {
    marginHorizontal: space.screenPadding,
    borderLeftWidth: 3, borderRadius: radius.r2,
    padding: space.space4,
    minHeight: 160,
  },
  carouselStack: { position: 'relative', minHeight: 130 },
  votdQuote: {
    fontFamily: fonts.serifRegular, fontStyle: 'italic',
    fontSize: 14, lineHeight: 22,
  },
  votdCat: {
    fontFamily: fonts.sansBold, fontSize: 9,
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginTop: 10,
  },
  votdRef: { fontFamily: fonts.sansMedium, fontSize: 10.5, marginTop: 3 },
  carouselDots: {
    flexDirection: 'row', justifyContent: 'center', gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
  },
});
