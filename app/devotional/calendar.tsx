import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check, Lock, BookOpen, Flame, PartyPopper } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { space, radius, fonts, type } from '@/theme/tokens';
import { useScreenClearance } from '@/utils/layout';
import { useDevotionsStore } from '@/stores/useDevotionsStore';

export default function DevotionalJourneyScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const screenClearance = useScreenClearance();
  const hydrated = useDevotionsStore((s) => s.hydrated);
  const todayDay = useDevotionsStore((s) => s.todayDay);
  const completedDays = useDevotionsStore((s) => s.completedDays);
  const currentStreak = useDevotionsStore((s) => s.progress?.currentStreak ?? 0);
  const [selection, setSelection] = useState<'tomorrow' | 'coming' | null>(null);

  const weekday = useMemo(
    () => (offset: number) =>
      new Date(Date.now() + offset * 86400000).toLocaleDateString('en-US', { weekday: 'long' }),
    []
  );

  const complete = todayDay === 0;
  const yesterday = todayDay - 1;
  const todayCompleted = todayDay > 0 && completedDays.includes(todayDay);
  const yesterdayCompleted = yesterday >= 1 && completedDays.includes(yesterday);

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <View style={[styles.appbar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon} accessibilityLabel="Back">
          <ChevronLeft size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.appbarTitle, { color: palette.text }]}>Your Journey</Text>
        <View style={{ flex: 1 }} />
      </View>

      {!hydrated ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[type.caption, { color: palette.textSecondary }]}>Loading your journey…</Text>
        </View>
      ) : complete ? (
        <View style={{ paddingHorizontal: space.screenPadding, marginTop: 20 }}>
          <View style={[styles.completeCard, { backgroundColor: palette.surface }]}>
            <View style={[styles.completeIcon, { backgroundColor: palette.surfaceAlt }]}>
              <PartyPopper size={26} color={palette.highlight} />
            </View>
            <Text style={[styles.completeTitle, { color: palette.text }]}>All devotionals completed</Text>
            <Text style={[styles.completeSub, { color: palette.textSecondary }]}>
              You've completed all currently available devotionals. Thank you for walking daily with God's Word.
              {'\n'}Watch for future devotional updates.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/devotional/complete')}
              activeOpacity={0.9}
              style={[styles.completeCta, { backgroundColor: palette.primary }]}
            >
              <Text style={[styles.completeCtaText, { color: palette.onPrimary }]}>View completion</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: screenClearance }} showsVerticalScrollIndicator={false}>
          <View style={[styles.summaryCard, { backgroundColor: palette.surface, marginHorizontal: space.screenPadding }]}>
            <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>TODAY'S DEVOTIONAL</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryTitle, { color: palette.text }]}>
                {todayCompleted ? 'Completed' : 'Ready for you today'}
              </Text>
              <View style={styles.summaryStreak}>
                <Flame size={14} color={palette.highlight} />
                <Text style={[styles.summaryStreakText, { color: palette.text }]}>{currentStreak} day streak</Text>
              </View>
            </View>
          </View>

          <View style={[styles.window, { paddingHorizontal: space.screenPadding }]}>
            {yesterday >= 1 && (
              <WindowCard
                label="Yesterday"
                status={yesterdayCompleted ? 'completed' : 'available'}
                onPress={() => router.push(`/devotional/${yesterday}`)}
              />
            )}
            <WindowCard
              label="Today"
              status={todayCompleted ? 'completed' : 'available'}
              highlight
              onPress={() => router.push(`/devotional/${todayDay}`)}
            />
            <WindowCard
              label="Tomorrow"
              status="locked"
              onPress={() => setSelection((s) => (s === 'tomorrow' ? null : 'tomorrow'))}
            />
            <WindowCard
              label={weekday(2)}
              status="locked"
              onPress={() => setSelection((s) => (s === 'coming' ? null : 'coming'))}
            />
          </View>

          {selection && (
            <View style={{ paddingHorizontal: space.screenPadding, marginTop: 16 }}>
              <View style={[styles.infoCard, { backgroundColor: palette.surfaceAlt }]}>
                <Text style={[styles.infoTitle, { color: palette.text }]}>
                  {selection === 'tomorrow' ? "Tomorrow's devotional" : 'Coming Soon'}
                </Text>
                <Text style={[styles.infoBody, { color: palette.textSecondary }]}>
                  {selection === 'tomorrow'
                    ? 'Available tomorrow at your reminder time.\nGod has something special waiting for you.'
                    : "This devotional will become available\nafter tomorrow's reading."}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function WindowCard({ label, status, highlight, onPress }: {
  label: string;
  status: 'completed' | 'available' | 'locked';
  highlight?: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  const icon = status === 'locked' ? (
    <View style={[styles.windowIconWrap, { backgroundColor: palette.border }]}>
      <Lock size={18} color={palette.textSecondary} />
    </View>
  ) : (
    <View style={[styles.windowIconWrap, { backgroundColor: status === 'completed' ? palette.success : palette.primary }]}>
      {status === 'completed' ? (
        <Check size={18} color={palette.onAccent} strokeWidth={3} />
      ) : (
        <BookOpen size={18} color={palette.onPrimary} />
      )}
    </View>
  );
  const statusText = status === 'completed' ? 'Completed' : status === 'locked' ? 'Locked' : 'Read';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.windowCard, {
        backgroundColor: palette.surface,
        borderColor: highlight ? palette.primary : palette.border,
      }]}
    >
      <Text style={[styles.windowLabel, { color: palette.textSecondary }]}>{label}</Text>
      {icon}
      <Text style={[styles.windowStatus, { color: palette.text }]}>{statusText}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  appbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space.screenPadding, paddingTop: 56, paddingBottom: 10,
    borderBottomWidth: 1,
  },
  appbarTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  headerIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  summaryCard: {
    borderRadius: radius.r2, padding: space.space5, marginTop: 20,
  },
  summaryLabel: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  summaryTitle: { fontFamily: fonts.serifBold, fontSize: 18 },
  summaryStreak: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryStreakText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  window: {
    flexDirection: 'row', gap: 10, marginTop: 16,
  },
  windowCard: {
    flex: 1, alignItems: 'center', gap: 10,
    borderRadius: radius.r2, borderWidth: 1.5,
    paddingVertical: 18, paddingHorizontal: 6,
  },
  windowLabel: { fontFamily: fonts.sansMedium, fontSize: 11 },
  windowIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  windowStatus: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  infoCard: {
    borderRadius: radius.r2, padding: space.space5,
  },
  infoTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  infoBody: { fontFamily: fonts.sansRegular, fontSize: 13, lineHeight: 20, marginTop: 6 },
  completeCard: {
    borderRadius: radius.r2, padding: space.space5,
    alignItems: 'center',
  },
  completeIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  completeTitle: { fontFamily: fonts.serifBold, fontSize: 20, marginTop: 12 },
  completeSub: {
    fontFamily: fonts.sansRegular, fontSize: 13, lineHeight: 20,
    textAlign: 'center', marginTop: 8,
  },
  completeCta: {
    marginTop: 16, borderRadius: radius.rFull,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  completeCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
});
