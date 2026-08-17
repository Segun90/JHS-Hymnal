import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Text, Share,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft, BookOpen, Quote, PencilLine, Heart, Check, Share2,
  ImageDown, NotebookPen, Lock, PartyPopper,
} from 'lucide-react-native';
import * as ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { documentDirectory, copyAsync } from 'expo-file-system/legacy';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';
import { space, radius, fonts, type } from '@/theme/tokens';
import { useDevotionsStore } from '@/stores/useDevotionsStore';
import { parseScriptureRef } from '@/utils/references';
import { useScreenClearance } from '@/utils/layout';

function formatReminderTime(): string {
  const { devotionalHour, devotionalMinute } = useDevotionsStore.getState().notifications;
  const suffix = devotionalHour >= 12 ? 'PM' : 'AM';
  const h12 = devotionalHour % 12 === 0 ? 12 : devotionalHour % 12;
  return `${h12}:${String(devotionalMinute).padStart(2, '0')} ${suffix}`;
}

export default function DevotionalReaderScreen() {
  const { day } = useLocalSearchParams();
  const dayNum = parseInt(day as string, 10);
  const router = useRouter();
  const { palette } = useTheme();
  const screenClearance = useScreenClearance();

  const todayDay = useDevotionsStore((s) => s.todayDay);
  const totalDays = useDevotionsStore((s) => s.totalDays);
  const completedDays = useDevotionsStore((s) => s.completedDays);

  const isLocked = dayNum > 0 && totalDays > 0 && dayNum > todayDay && !completedDays.includes(dayNum);

  const devotional = useMemo(
    () => (dayNum > 0 ? useDevotionsStore.getState().getDayDevotional(dayNum) : null),
    [dayNum]
  );
  const progress = useMemo(
    () => (dayNum > 0 ? useDevotionsStore.getState().getDayProgress(dayNum) : null),
    [dayNum]
  );

  const [completed, setCompleted] = useState(!!progress?.completedAt);
  const [note, setNote] = useState(progress?.notes ?? '');
  const [prayer, setPrayer] = useState(progress?.prayerJournal ?? '');
  const [showNotes, setShowNotes] = useState(false);
  const [showPrayer, setShowPrayer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLast, setIsLast] = useState(false);

  const cardRef = useRef<View>(null);
  const saveNoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savePrayerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scriptureParts = useMemo(() => {
    if (!devotional) return null;
    return parseScriptureRef(devotional.scripture);
  }, [devotional]);

  useEffect(() => {
    if (dayNum > 0 && !isLocked) {
      useDevotionsStore.getState().recordRead(dayNum);
    }
  }, [dayNum, isLocked]);

  useEffect(() => {
    return () => {
      if (saveNoteTimer.current) clearTimeout(saveNoteTimer.current);
      if (savePrayerTimer.current) clearTimeout(savePrayerTimer.current);
    };
  }, []);

  if (isLocked) {
    return (
      <View style={[styles.root, { backgroundColor: palette.background }]}>
        <Header title="Devotional" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.screenPadding }}>
          <View style={[styles.lockIcon, { backgroundColor: palette.surfaceAlt }]}>
            <Lock size={26} color={palette.textSecondary} />
          </View>
          <Text style={[type.bodyStrong, { color: palette.text, marginTop: 16, fontSize: 17 }]}>
            Not available yet
          </Text>
          <Text style={[type.body, { color: palette.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 }]}>
            This devotional will become available after you complete today's reading.
            {'\n\n'}God has something special waiting for you.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace(todayDay ? `/devotional/${todayDay}` : '/(tabs)/devotions')}
            activeOpacity={0.85}
            style={[styles.lockedCta, { backgroundColor: palette.primary }]}
          >
            <Text style={[styles.lockedCtaText, { color: palette.onPrimary }]}>
              {todayDay ? "Back to today's devotional" : 'Back to Devotions'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!devotional) {
    return (
      <View style={[styles.root, { backgroundColor: palette.background }]}>
        <Header title="Devotional" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.screenPadding }}>
          <Text style={[type.body, { color: palette.textSecondary, textAlign: 'center' }]}>
            This devotional is not available.
          </Text>
        </View>
      </View>
    );
  }

  const toggleCompleted = () => {
    if (!completed) {
      const result = useDevotionsStore.getState().markCompleted(dayNum);
      setCompleted(true);
      setIsLast(result.isLast);
    } else {
      useDevotionsStore.getState().toggleCompleted(dayNum);
      setCompleted(false);
      setIsLast(false);
    }
  };

  const onChangeNote = (text: string) => {
    setNote(text);
    if (saveNoteTimer.current) clearTimeout(saveNoteTimer.current);
    saveNoteTimer.current = setTimeout(() => {
      useDevotionsStore.getState().saveNote(dayNum, text);
    }, 600);
  };

  const onChangePrayer = (text: string) => {
    setPrayer(text);
    if (savePrayerTimer.current) clearTimeout(savePrayerTimer.current);
    savePrayerTimer.current = setTimeout(() => {
      useDevotionsStore.getState().savePrayer(dayNum, text);
    }, 600);
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `J.H.S Daily Devotional\n\n${devotional.title}\n${devotional.scripture}\n\n"${devotional.memoryVerse}"\n\nShared from JHS Mobile App – Daily Devotional`,
      });
    } catch {}
  };

  const onSaveImage = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const uri = await ViewShot.captureRef(cardRef.current, {
        format: 'png', quality: 1, result: 'tmpfile',
      });
      const fileName = `JHS_Devotional_Day${dayNum}.png`;
      const dest = `${documentDirectory}${fileName}`;
      await copyAsync({ from: uri, to: dest });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(dest, { mimeType: 'image/png', dialogTitle: 'Share Devotional' });
      }
    } catch (e) {
      console.warn('Failed to save devotional image:', e);
    }
    setSaving(false);
  };

  const openScripture = () => {
    if (!scriptureParts) return;
    router.push(`/bible/${scriptureParts.bookId}/${scriptureParts.chapter}`);
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <Header
        title={dayNum === todayDay ? "Today's Devotional" : 'Daily Devotional'}
        onBack={() => router.back()}
        trailing={
          <TouchableOpacity onPress={onShare} style={styles.headerIcon} accessibilityLabel="Share">
            <Share2 size={20} color={palette.text} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: screenClearance }}
          showsVerticalScrollIndicator={false}
        >
          <View ref={cardRef} collapsable={false} style={[styles.cardCapture, { backgroundColor: palette.background }]}>
            <View style={styles.heroBlock}>
              <Text style={[styles.dayLabel, { color: palette.accent }]}>
                {dayNum === todayDay ? "TODAY'S DEVOTIONAL" : 'DAILY DEVOTIONAL'}
              </Text>
              <Text style={[styles.title, { color: palette.text }]}>{devotional.title}</Text>

              <TouchableOpacity
                onPress={openScripture}
                style={[styles.scriptureChip, { backgroundColor: palette.surfaceAlt }]}
                activeOpacity={0.8}
              >
                <BookOpen size={15} color={palette.primary} />
                <Text style={[styles.scriptureText, { color: palette.primary }]}>{devotional.scripture}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.memoryCard, { backgroundColor: palette.surface, borderLeftColor: palette.accent }]}>
              <View style={styles.memoryHeader}>
                <Quote size={16} color={palette.accent} />
                <Text style={[styles.memoryLabel, { color: palette.accent }]}>MEMORY VERSE</Text>
              </View>
              <Text style={[styles.memoryText, { color: palette.text }]}>{devotional.memoryVerse}</Text>
            </View>

            <Text style={[styles.devotionalBody, { color: palette.text }]}>{devotional.devotional}</Text>

            {devotional.prayer ? (
              <View style={[styles.prayerCard, { backgroundColor: palette.surfaceAlt }]}>
                <View style={styles.memoryHeader}>
                  <Heart size={16} color={palette.accent} />
                  <Text style={[styles.memoryLabel, { color: palette.accent }]}>PRAYER</Text>
                </View>
                <Text style={[styles.prayerText, { color: palette.text }]}>{devotional.prayer}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actionsRow}>
            <ActionPill
              icon={<Check size={16} color={completed ? palette.onPrimary : palette.success} />}
              label={completed ? 'Completed' : 'Mark as read'}
              filled={completed}
              onPress={toggleCompleted}
            />
            <ActionPill
              icon={<ImageDown size={16} color={palette.textSecondary} />}
              label={saving ? 'Saving…' : 'Save as image'}
              filled={false}
              onPress={onSaveImage}
              disabled={saving}
            />
          </View>

          {completed && isLast && (
            <Animated.View entering={FadeInUp.duration(250)} style={[styles.nextCard, { backgroundColor: palette.surfaceAlt, marginTop: 16 }]}>
              <View style={[styles.nextIcon, { backgroundColor: palette.success }]}>
                <PartyPopper size={18} color={palette.onAccent} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.nextTitle, { color: palette.text }]}>Collection complete</Text>
                <Text style={[styles.nextSub, { color: palette.textSecondary }]}>
                  You've completed all currently available devotionals. Thank you for walking daily with God's Word. Watch for future devotional updates.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.replace('/devotional/complete')}
                activeOpacity={0.85}
                style={[styles.nextCta, { backgroundColor: palette.primary }]}
              >
                <Text style={[styles.nextCtaText, { color: palette.onPrimary }]}>View</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {completed && !isLast && (
            <Animated.View entering={FadeInUp.duration(250)} style={[styles.nextCard, { backgroundColor: palette.surfaceAlt, marginTop: 16 }]}>
              <View style={[styles.nextIcon, { backgroundColor: palette.success }]}>
                <Check size={18} color={palette.onAccent} strokeWidth={3} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.nextTitle, { color: palette.text }]}>Today's devotional completed</Text>
                <Text style={[styles.nextSub, { color: palette.textSecondary }]}>
                  Tomorrow's devotional will be available at {formatReminderTime()} according to your reminder.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.85}
                style={[styles.nextCta, { backgroundColor: palette.primary }]}
              >
                <Text style={[styles.nextCtaText, { color: palette.onPrimary }]}>Done</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <TouchableOpacity
            onPress={() => setShowNotes((v) => !v)}
            style={[styles.expandRow, { backgroundColor: palette.surface, marginTop: 16 }]}
            activeOpacity={0.85}
          >
            <View style={[styles.expandIcon, { backgroundColor: palette.surfaceAlt }]}>
              <PencilLine size={18} color={palette.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[type.bodyStrong, { color: palette.text }]}>My Notes</Text>
              <Text style={[type.caption, { color: palette.textSecondary, marginTop: 1 }]}>
                {note ? 'Tap to edit' : 'Capture what this means to you'}
              </Text>
            </View>
            <ChevronDown />
          </TouchableOpacity>
          {showNotes && (
            <Animated.View entering={FadeInUp.duration(200)} style={{ paddingHorizontal: space.screenPadding }}>
              <TextInput
                value={note}
                onChangeText={onChangeNote}
                multiline
                placeholder="Write your notes for today…"
                placeholderTextColor={palette.textSecondary}
                style={[styles.input, { backgroundColor: palette.surface, color: palette.text }]}
              />
            </Animated.View>
          )}

          <TouchableOpacity
            onPress={() => setShowPrayer((v) => !v)}
            style={[styles.expandRow, { backgroundColor: palette.surface, marginTop: 12 }]}
            activeOpacity={0.85}
          >
            <View style={[styles.expandIcon, { backgroundColor: palette.surfaceAlt }]}>
              <NotebookPen size={18} color={palette.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[type.bodyStrong, { color: palette.text }]}>Prayer Journal</Text>
              <Text style={[type.caption, { color: palette.textSecondary, marginTop: 1 }]}>
                {prayer ? 'Tap to edit' : 'Write down your prayer points'}
              </Text>
            </View>
            <ChevronDown />
          </TouchableOpacity>
          {showPrayer && (
            <Animated.View entering={FadeInUp.duration(200)} style={{ paddingHorizontal: space.screenPadding }}>
              <TextInput
                value={prayer}
                onChangeText={onChangePrayer}
                multiline
                placeholder="Prayer journal for today…"
                placeholderTextColor={palette.textSecondary}
                style={[styles.input, { backgroundColor: palette.surface, color: palette.text }]}
              />
            </Animated.View>
          )}

          {scriptureParts && (
            <TouchableOpacity
              onPress={openScripture}
              style={[styles.bibleLink, { borderColor: palette.border }]}
              activeOpacity={0.8}
            >
              <BookOpen size={18} color={palette.primary} />
              <Text style={[styles.bibleLinkText, { color: palette.primary }]}>
                Open {devotional.scripture} in the Bible
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function ChevronDown() {
  return <View style={styles.chevronPlaceholder} />;
}

function Header({ title, onBack, trailing }: { title: string; onBack: () => void; trailing?: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <View style={[styles.appbar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
      <TouchableOpacity onPress={onBack} style={styles.headerIcon} accessibilityLabel="Back">
        <ChevronLeft size={24} color={palette.text} />
      </TouchableOpacity>
      <Text style={[styles.appbarTitle, { color: palette.text }]}>{title}</Text>
      <View style={{ flex: 1 }} />
      {trailing}
    </View>
  );
}

function ActionPill({ icon, label, filled, onPress, disabled }: any) {
  const { palette } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        styles.actionPill,
        { borderColor: palette.border, backgroundColor: filled ? palette.success : palette.surface },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.actionPillText,
          { color: filled ? palette.onAccent : palette.text },
        ]}
      >
        {label}
      </Text>
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
  appbarTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, marginLeft: 4 },
  headerIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  cardCapture: { paddingHorizontal: space.screenPadding, paddingTop: 20 },
  heroBlock: { alignItems: 'flex-start' },
  dayLabel: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1.5 },
  title: { fontFamily: fonts.serifBold, fontSize: 24, lineHeight: 32, marginTop: 8 },
  scriptureChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: radius.rFull, paddingHorizontal: 14, paddingVertical: 8,
    marginTop: 14,
  },
  scriptureText: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  memoryCard: {
    borderRadius: radius.r2, padding: space.space5, marginTop: 22,
    borderLeftWidth: 3,
  },
  memoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memoryLabel: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.2 },
  memoryText: {
    fontFamily: fonts.serifRegular, fontStyle: 'italic',
    fontSize: 15, lineHeight: 24, marginTop: 12,
  },
  devotionalBody: {
    fontFamily: fonts.sansRegular, fontSize: 16, lineHeight: 28,
    marginTop: 22,
  },
  prayerCard: {
    borderRadius: radius.r2, padding: space.space5, marginTop: 22,
  },
  prayerText: { fontFamily: fonts.serifRegular, fontSize: 15, lineHeight: 24, marginTop: 12 },
  actionsRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: space.screenPadding, marginTop: 20,
  },
  actionPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: radius.rFull, paddingVertical: 12,
  },
  actionPillText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5 },
  nextCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: space.screenPadding, borderRadius: radius.r2,
    padding: space.space4,
  },
  nextIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  nextTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13.5 },
  nextSub: { fontFamily: fonts.sansMedium, fontSize: 11, marginTop: 2, lineHeight: 16 },
  nextCta: {
    borderRadius: radius.rFull, paddingHorizontal: 16, paddingVertical: 9,
    marginLeft: 8,
  },
  nextCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  expandRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: space.screenPadding, borderRadius: radius.r2,
    padding: space.space4,
  },
  expandIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    minHeight: 120, borderRadius: radius.r2,
    padding: space.space4, marginTop: 12,
    fontFamily: fonts.sansRegular, fontSize: 15, lineHeight: 24,
    textAlignVertical: 'top',
  },
  chevronPlaceholder: { width: 18 },
  bibleLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: space.screenPadding, marginTop: 20,
    borderWidth: 1.5, borderRadius: radius.rFull, paddingVertical: 13,
  },
  bibleLinkText: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  lockIcon: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  lockedCta: {
    marginTop: 20, borderRadius: radius.rFull,
    paddingHorizontal: 24, paddingVertical: 13,
  },
  lockedCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
});
