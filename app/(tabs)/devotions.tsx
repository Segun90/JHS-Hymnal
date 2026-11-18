import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Sun, BookOpen, Calendar as CalendarIcon, Bell, ChevronRight, Sunrise, PartyPopper } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';
import { space, radius, fonts, type, gradients } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { useTabBarClearance } from '@/utils/layout';
import { useDevotionsStore } from '@/stores/useDevotionsStore';
import { AppBar } from '@/components/AppBar';

function timeOfDay(): { greeting: string } {
  const h = new Date().getHours();
  if (h < 12) return { greeting: 'Good Morning' };
  if (h < 17) return { greeting: 'Good Afternoon' };
  return { greeting: 'Good Evening' };
}

function epochDay(d: Date = new Date()): number {
  return Math.floor(d.getTime() / 86400000);
}

export default function DevotionsScreen() {
  const { palette } = useTheme();
  const tabBarClearance = useTabBarClearance();
  const router = useRouter();
  const { todayDay, completedDays, notifications, progress } = useDevotionsStore();

  const { greeting } = useMemo(timeOfDay, []);

  const today = useMemo(() => {
    if (!todayDay) return null;
    return useDevotionsStore.getState().getDayDevotional(todayDay);
  }, [todayDay]);

  const dateLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }, []);

  const missedDays = useMemo(() => {
    if (!progress) return 0;
    if (progress.completedToday) return 0;
    if (progress.lastReadDate == null) return 0;
    return Math.max(0, epochDay() - progress.lastReadDate);
  }, [progress]);

  const reminderSummary = useMemo(() => {
    const parts: string[] = [];
    if (notifications.devotionalEnabled) {
      parts.push(`Devotional ${String(notifications.devotionalHour).padStart(2, '0')}:${String(notifications.devotionalMinute).padStart(2, '0')}`);
    }
    if (notifications.bibleEnabled) {
      parts.push(`Bible ${String(notifications.bibleHour).padStart(2, '0')}:${String(notifications.bibleMinute).padStart(2, '0')}`);
    }
    if (notifications.prayerEnabled) {
      parts.push(`Prayer ${String(notifications.prayerHour).padStart(2, '0')}:${String(notifications.prayerMinute).padStart(2, '0')}`);
    }
    return parts.length ? parts.join('  ·  ') : 'Set daily reminders for devotionals, Bible reading, and prayer';
  }, [notifications]);

  const complete = !!progress && !progress.hasCurrent && todayDay === 0;

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <AppBar 
        title="Devotions" 
        variant="primary" 
        leading={<Sun size={22} color={palette.onPrimary} />}
        trailing={
          <TouchableOpacity onPress={() => router.push('/devotional/calendar')} style={styles.iconBtn}>
            <CalendarIcon size={22} color={palette.onPrimary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: tabBarClearance }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(100)} style={{ paddingHorizontal: space.screenPadding, marginTop: 18 }}>
          <Text style={[styles.dateLabel, { color: palette.textSecondary }]}>{dateLabel}</Text>
          <Text style={[styles.greeting, { color: palette.text }]}>
            {missedDays > 0 ? 'Welcome Back' : greeting}
          </Text>
          {missedDays > 0 && !complete && (
            <Text style={[styles.welcomeBackSub, { color: palette.textSecondary }]}>
              Your daily devotional is waiting for you. Continue where you left off.
            </Text>
          )}
        </Animated.View>

        {complete ? (
          <Animated.View entering={FadeInUp.delay(160)} style={{ paddingHorizontal: space.screenPadding, marginTop: 16 }}>
            <TouchableOpacity
              onPress={() => router.push('/devotional/complete')}
              activeOpacity={0.9}
              style={styles.hero}
            >
              <View style={StyleSheet.absoluteFill}>
                <LinearGradient colors={['#13224a', '#0a1128']} style={StyleSheet.absoluteFill} start={{x: 0, y: 0}} end={{x: 1, y: 1}} />
                <Image 
                  source={require('../../assets/images/devotional-bg.png')}
                  style={{ position: 'absolute', height: '120%', width: '130%', right: 0, bottom: 0, opacity: 0.2 }}
                  resizeMode="cover"
                />
              </View>
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.1)' }]} pointerEvents="none" />
              <View style={styles.heroTop}>
                <View style={styles.dayPill}>
                  <PartyPopper size={14} color={palette.onPrimary} />
                  <Text style={[styles.dayPillText, { color: palette.onPrimary }]}>COMPLETE</Text>
                </View>
              </View>
              <Text style={[styles.heroTitle, { color: palette.onPrimary }]}>Congratulations!</Text>
              <Text style={[styles.heroScripture, { color: palette.onPrimary, opacity: 0.85 }]}>
                You have completed the devotional collection. Thank you for walking daily with God's Word.
              </Text>
              <View style={styles.heroAction}>
                <Text style={[styles.heroActionText, { color: palette.onPrimary }]}>View completion</Text>
                <ChevronRight size={18} color={palette.onPrimary} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ) : today ? (
          <Animated.View entering={FadeInUp.delay(160)} style={{ paddingHorizontal: space.screenPadding, marginTop: 16 }}>
            <TouchableOpacity
              onPress={() => router.push(`/devotional/${todayDay}`)}
              activeOpacity={0.9}
              style={styles.hero}
            >
              <View style={StyleSheet.absoluteFill}>
                <LinearGradient colors={['#13224a', '#0a1128']} style={StyleSheet.absoluteFill} start={{x: 0, y: 0}} end={{x: 1, y: 1}} />
                <Image 
                  source={require('../../assets/images/devotional-bg.png')}
                  style={{ position: 'absolute', height: '120%', width: '130%', right: 0, bottom: 0, opacity: 0.2 }}
                  resizeMode="cover"
                />
              </View>
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.1)' }]} pointerEvents="none" />
              <View style={styles.heroTop}>
                <View style={styles.dayPill}>
                  <Sunrise size={14} color={palette.onPrimary} />
                  <Text style={[styles.dayPillText, { color: palette.onPrimary }]}>
                    TODAY'S DEVOTIONAL
                  </Text>
                </View>
              </View>
              <Text style={[styles.heroTitle, { color: palette.onPrimary }]}>{today.title}</Text>
              <Text style={[styles.heroScripture, { color: palette.onPrimary, opacity: 0.85 }]}>{today.scripture}</Text>
              <View style={styles.heroAction}>
                <Text style={[styles.heroActionText, { color: palette.onPrimary }]}>
                  {completedDays.includes(todayDay) ? 'Re-read devotional' : 'Read today\'s devotional'}
                </Text>
                <ChevronRight size={18} color={palette.onPrimary} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={{ paddingHorizontal: space.screenPadding, marginTop: 16 }}>
            <View style={[styles.emptyCard, { backgroundColor: palette.surface }]}>
              <Text style={[type.bodyStrong, { color: palette.text }]}>Your daily devotional</Text>
              <Text style={[type.caption, { color: palette.textSecondary, marginTop: 6 }]}>
                Loading your devotional for today…
              </Text>
            </View>
          </View>
        )}

        <View style={{ paddingHorizontal: space.screenPadding, marginTop: 16 }}>
          <TouchableOpacity
            onPress={() => router.push('/devotional/calendar')}
            activeOpacity={0.85}
            style={[styles.rowCard, { backgroundColor: palette.surface }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: palette.surfaceAlt }]}>
              <CalendarIcon size={20} color={palette.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[type.bodyStrong, { color: palette.text }]}>Your Journey</Text>
              <Text style={[type.caption, { color: palette.textSecondary, marginTop: 1 }]}>
                Yesterday · Today · Tomorrow
              </Text>
            </View>
            <ChevronRight size={18} color={palette.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/reminders')}
            activeOpacity={0.85}
            style={[styles.rowCard, { backgroundColor: palette.surface }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: palette.surfaceAlt }]}>
              <Bell size={20} color={palette.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[type.bodyStrong, { color: palette.text }]}>Reminder & Alarm Settings</Text>
              <Text style={[type.caption, { color: palette.textSecondary, marginTop: 1 }]}>
                {reminderSummary}
              </Text>
            </View>
            <ChevronRight size={18} color={palette.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/devotional/welcome')}
            activeOpacity={0.85}
            style={[styles.rowCard, { backgroundColor: palette.surface }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: palette.surfaceAlt }]}>
              <BookOpen size={20} color={palette.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[type.bodyStrong, { color: palette.text }]}>About Daily Devotional</Text>
              <Text style={[type.caption, { color: palette.textSecondary, marginTop: 1 }]}>
                How this journey works
              </Text>
            </View>
            <ChevronRight size={18} color={palette.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  appbar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: space.screenPadding, paddingTop: 56, paddingBottom: 12,
  },
  appbarTitle: { fontFamily: fonts.sansSemiBold, fontSize: 18 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dateLabel: { fontFamily: fonts.sansMedium, fontSize: 13 },
  greeting: { fontFamily: fonts.serifSemiBold, fontSize: 26, marginTop: 2 },
  welcomeBackSub: { fontFamily: fonts.sansRegular, fontSize: 13, marginTop: 4 },
  hero: {
    borderRadius: radius.r3, padding: space.space5, overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 4,
  },
  heroBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: radius.r3,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radius.rFull,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  dayPillText: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.6 },
  heroTitle: { fontFamily: fonts.serifBold, fontSize: 22, lineHeight: 29, marginTop: 16 },
  heroScripture: { fontFamily: fonts.sansMedium, fontSize: 13, marginTop: 8, lineHeight: 19 },
  heroAction: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 18, alignSelf: 'flex-start',
  },
  heroActionText: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  emptyCard: { borderRadius: radius.r2, padding: space.space5 },
  rowCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.r2, padding: space.space4,
    marginBottom: 12,
  },
  rowIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
});
