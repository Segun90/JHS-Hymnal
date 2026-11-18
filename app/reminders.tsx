import React, { useMemo, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ChevronLeft, ChevronRight, Clock, BookMarked, BookOpen, BellRing, Volume2, Vibrate, MoonStar } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';
import { space, fonts, radius } from '@/theme/tokens';
import { useScreenClearance } from '@/utils/layout';
import { useDevotionsStore } from '@/stores/useDevotionsStore';
import { requestExactAlarmAccess } from '@/services/notifications';
import { AppBar } from '@/components/AppBar';
import { ActionSheet } from '@/components/ActionSheet';
import type { NotificationSettings } from '@/db/notifications';

type Target = 'devotional' | 'bible' | 'prayer' | 'quietStart' | 'quietEnd';

function formatLabel(hour: number, minute: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function dateFromTime(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

export default function RemindersScreen() {
  const { palette } = useTheme();
  const screenClearance = useScreenClearance();
  const router = useRouter();
  const notifications = useDevotionsStore((s) => s.notifications);
  const setNotifications = useDevotionsStore((s) => s.setNotificationSettings);

  const [picking, setPicking] = useState<Target | null>(null);
  const [draft, setDraft] = useState<Date>(new Date());
  const pickingRef = useRef<Target | null>(null);
  const [showRingtoneSheet, setShowRingtoneSheet] = useState(false);

  const quietEnabled = !!(notifications.quietHoursStart && notifications.quietHoursEnd);

  const apply = (target: Target, hour: number, minute: number) => {
    const next: NotificationSettings = { ...notifications };
    if (target === 'devotional') {
      next.devotionalHour = hour;
      next.devotionalMinute = minute;
    } else if (target === 'bible') {
      next.bibleHour = hour;
      next.bibleMinute = minute;
    } else if (target === 'prayer') {
      next.prayerHour = hour;
      next.prayerMinute = minute;
    } else if (target === 'quietStart') {
      next.quietHoursStart = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    } else {
      next.quietHoursEnd = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
    setNotifications(next);
  };

  const openPicker = (target: Target) => {
    const t = notifications;
    let hour = 7;
    let minute = 0;
    if (target === 'devotional') { hour = t.devotionalHour; minute = t.devotionalMinute; }
    else if (target === 'bible') { hour = t.bibleHour; minute = t.bibleMinute; }
    else if (target === 'prayer') { hour = t.prayerHour; minute = t.prayerMinute; }
    else if (target === 'quietStart') { const p = t.quietHoursStart?.split(':').map(Number) ?? [22, 0]; hour = p[0]; minute = p[1]; }
    else { const p = t.quietHoursEnd?.split(':').map(Number) ?? [7, 0]; hour = p[0]; minute = p[1]; }
    pickingRef.current = target;
    setDraft(dateFromTime(hour, minute));
    setPicking(target);
  };

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    const target = pickingRef.current;
    if (!target) return;
    if (Platform.OS === 'android') {
      setPicking(null);
      pickingRef.current = null;
      if (event.type === 'set' && date) {
        apply(target, date.getHours(), date.getMinutes());
      }
    } else if (date) {
      setDraft(date);
    }
  };

  const confirmDraft = () => {
    const target = pickingRef.current;
    if (target) apply(target, draft.getHours(), draft.getMinutes());
    setPicking(null);
    pickingRef.current = null;
  };

  const cancelPicker = () => {
    setPicking(null);
    pickingRef.current = null;
  };

  const toggleQuietHours = (on: boolean) => {
    const next: NotificationSettings = { ...notifications };
    if (on) {
      next.quietHoursStart = next.quietHoursStart || '22:00';
      next.quietHoursEnd = next.quietHoursEnd || '07:00';
    } else {
      next.quietHoursStart = null;
      next.quietHoursEnd = null;
    }
    setNotifications(next);
  };

  const reminderRows = useMemo(
    () => [
      { key: 'devotional' as const, title: 'Daily Devotional', desc: 'Start each day with God\'s Word', icon: BookMarked },
      { key: 'bible' as const, title: 'Bible Reading', desc: 'Spend time reading the Scriptures', icon: BookOpen },
      { key: 'prayer' as const, title: 'Prayer', desc: 'Set aside a moment to pray', icon: BellRing },
    ],
    []
  );

  const reminderEnabled = (key: 'devotional' | 'bible' | 'prayer') =>
    key === 'devotional' ? notifications.devotionalEnabled : key === 'bible' ? notifications.bibleEnabled : notifications.prayerEnabled;

  const reminderHour = (key: 'devotional' | 'bible' | 'prayer') =>
    key === 'devotional' ? notifications.devotionalHour : key === 'bible' ? notifications.bibleHour : notifications.prayerHour;

  const reminderMinute = (key: 'devotional' | 'bible' | 'prayer') =>
    key === 'devotional' ? notifications.devotionalMinute : key === 'bible' ? notifications.bibleMinute : notifications.prayerMinute;

  const toggleReminder = (key: 'devotional' | 'bible' | 'prayer', on: boolean) => {
    const next: NotificationSettings = { ...notifications };
    if (key === 'devotional') next.devotionalEnabled = on;
    else if (key === 'bible') next.bibleEnabled = on;
    else next.prayerEnabled = on;
    setNotifications(next);
    if (on) {
      requestExactAlarmAccess().catch(() => {});
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <AppBar 
        title="Reminder & Alarm Settings" 
        variant="primary" 
        onBack={() => router.back()} 
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: screenClearance }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(50).springify().damping(15)}>
          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: palette.textSecondary }]}>Daily Reminders</Text>
            <View style={[styles.card, { backgroundColor: palette.surface }]}>
              {reminderRows.map((row, i) => {
                const enabled = reminderEnabled(row.key);
                return (
                  <React.Fragment key={row.key}>
                    <View
                      style={[styles.remCard, i < reminderRows.length - 1 && { borderBottomColor: palette.border, borderBottomWidth: 1 }]}
                    >
                      <View style={[styles.rowIcon, { backgroundColor: palette.surfaceAlt }]}>
                        <row.icon size={20} color={palette.primary} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.setLabel, { color: palette.text }]}>{row.title}</Text>
                        <Text style={[styles.setDesc, { color: palette.textSecondary }]}>
                          {enabled ? `Daily at ${formatLabel(reminderHour(row.key), reminderMinute(row.key))}` : row.desc}
                        </Text>
                      </View>
                      <Switch
                        value={enabled}
                        onValueChange={(v) => toggleReminder(row.key, v)}
                        trackColor={{ false: palette.border, true: palette.primary }}
                        thumbColor={palette.surface}
                      />
                    </View>
                    {enabled && (
                      <TimeRow
                        label="Reminder time"
                        value={formatLabel(reminderHour(row.key), reminderMinute(row.key))}
                        palette={palette}
                        onPress={() => openPicker(row.key)}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify().damping(15)}>
          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: palette.textSecondary }]}>Notification Preferences</Text>
            <View style={[styles.card, { backgroundColor: palette.surface }]}>
              <View style={[styles.setRow, { borderBottomColor: palette.border, borderBottomWidth: 1 }]}>
                <Volume2 size={20} color={palette.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.setLabel, { color: palette.text }]}>Sound</Text>
                  <Text style={[styles.setDesc, { color: palette.textSecondary }]}>Play a tone with reminders</Text>
                </View>
                <Switch
                  value={notifications.sound}
                  onValueChange={(v) => setNotifications({ ...notifications, sound: v })}
                  trackColor={{ false: palette.border, true: palette.primary }}
                  thumbColor={palette.surface}
                />
              </View>
              {notifications.sound && (
                <TouchableOpacity 
                  style={[styles.setRow, { borderBottomColor: palette.border, borderBottomWidth: 1 }]} 
                  onPress={() => setShowRingtoneSheet(true)}
                >
                  <View style={{ width: 20 }} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.setLabel, { color: palette.text }]}>Notification Sound</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: palette.textSecondary, fontSize: 15, fontFamily: fonts.sansMedium }}>
                      {notifications.preferredSound === 'act' ? 'Act' : 
                       notifications.preferredSound === 'pray' ? 'Pray' : 
                       notifications.preferredSound === 'read' ? 'Read' : 
                       notifications.preferredSound === 'wake' ? 'Wake' : 
                       'Default'}
                    </Text>
                    <ChevronRight size={18} color={palette.textSecondary} />
                  </View>
                </TouchableOpacity>
              )}
              <View style={styles.setRow}>
                <Vibrate size={20} color={palette.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.setLabel, { color: palette.text }]}>Vibration</Text>
                  <Text style={[styles.setDesc, { color: palette.textSecondary }]}>Vibrate when a reminder arrives</Text>
                </View>
                <Switch
                  value={notifications.vibration}
                  onValueChange={(v) => setNotifications({ ...notifications, vibration: v })}
                  trackColor={{ false: palette.border, true: palette.primary }}
                  thumbColor={palette.surface}
                />
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).springify().damping(15)}>
          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: palette.textSecondary }]}>Quiet Hours</Text>
            <View style={[styles.card, { backgroundColor: palette.surface }]}>
              <View style={[styles.setRow, { borderBottomColor: palette.border, borderBottomWidth: 1 }]}>
                <MoonStar size={20} color={palette.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.setLabel, { color: palette.text }]}>Quiet hours</Text>
                  <Text style={[styles.setDesc, { color: palette.textSecondary }]}>Reminders during this window are delivered silently</Text>
                </View>
                <Switch
                  value={quietEnabled}
                  onValueChange={toggleQuietHours}
                  trackColor={{ false: palette.border, true: palette.primary }}
                  thumbColor={palette.surface}
                />
              </View>
              {quietEnabled && (
                <>
                  <TimeRow
                    label="From"
                    value={notifications.quietHoursStart ? formatLabel(...(notifications.quietHoursStart.split(':').map(Number) as [number, number])) : ''}
                    palette={palette}
                    onPress={() => openPicker('quietStart')}
                  />
                  <TimeRow
                    label="Until"
                    value={notifications.quietHoursEnd ? formatLabel(...(notifications.quietHoursEnd.split(':').map(Number) as [number, number])) : ''}
                    palette={palette}
                    onPress={() => openPicker('quietEnd')}
                  />
                </>
              )}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify().damping(15)}>
          <Text style={[styles.footerNote, { color: palette.textSecondary }]}>
            Reminders are delivered once each day at the times you choose. Changing a time safely replaces the existing schedule.
          </Text>
        </Animated.View>
      </ScrollView>

      {picking && Platform.OS === 'android' && (
        <DateTimePicker
          value={draft}
          mode="time"
          is24Hour={false}
          onChange={onPickerChange}
        />
      )}

      {picking && Platform.OS === 'ios' && (
        <View style={[styles.iosPickerWrap, { backgroundColor: palette.surface, borderTopColor: palette.border }]}>
          <View style={styles.iosPickerActions}>
            <TouchableOpacity onPress={cancelPicker} style={styles.iosPickerBtn}>
              <Text style={[styles.iosPickerBtnText, { color: palette.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmDraft} style={styles.iosPickerBtn}>
              <Text style={[styles.iosPickerBtnText, { color: palette.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={draft}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={onPickerChange}
            style={{ backgroundColor: palette.surface }}
          />
        </View>
      )}

      <ActionSheet
        visible={showRingtoneSheet}
        onCancel={() => setShowRingtoneSheet(false)}
        title="Choose Notification Sound"
        subtitle="Select sound for reminders"
        actions={[
          { label: 'Default System Sound', icon: <Volume2 size={20} color={palette.primary} />, onPress: () => { setNotifications({ ...notifications, preferredSound: 'default' }); setShowRingtoneSheet(false); } },
          { label: 'Act', icon: <Volume2 size={20} color={palette.primary} />, onPress: () => { setNotifications({ ...notifications, preferredSound: 'act' }); setShowRingtoneSheet(false); } },
          { label: 'Pray', icon: <Volume2 size={20} color={palette.primary} />, onPress: () => { setNotifications({ ...notifications, preferredSound: 'pray' }); setShowRingtoneSheet(false); } },
          { label: 'Read', icon: <Volume2 size={20} color={palette.primary} />, onPress: () => { setNotifications({ ...notifications, preferredSound: 'read' }); setShowRingtoneSheet(false); } },
          { label: 'Wake', icon: <Volume2 size={20} color={palette.primary} />, onPress: () => { setNotifications({ ...notifications, preferredSound: 'wake' }); setShowRingtoneSheet(false); } },
        ]}
      />
    </View>
  );
}

function TimeRow({ label, value, palette, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.setRow, { borderBottomColor: palette.border, borderBottomWidth: 1 }]} activeOpacity={0.7}>
      <Clock size={20} color={palette.primary} />
      <Text style={[styles.setLabel, { color: palette.text, flex: 1, marginLeft: 12 }]}>{label}</Text>
      <Text style={[styles.timeValue, { color: palette.textSecondary }]}>{value}</Text>
      <ChevronRight size={18} color={palette.textSecondary} />
    </TouchableOpacity>
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
  group: { marginHorizontal: space.screenPadding, marginTop: space.space5 },
  groupTitle: {
    fontFamily: fonts.sansBold, fontSize: 10.5, letterSpacing: 0.8,
    paddingHorizontal: 4, marginBottom: 7, textTransform: 'uppercase',
  },
  card: { borderRadius: 12, overflow: 'hidden', padding: 0 },
  remCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  rowIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  setRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  setLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  setDesc: { fontFamily: fonts.sansMedium, fontSize: 10.5, marginTop: 2 },
  timeValue: { fontFamily: fonts.sansSemiBold, fontSize: 13, marginRight: 4 },
  footerNote: {
    fontFamily: fonts.sansMedium, fontSize: 11, lineHeight: 17,
    textAlign: 'center', marginHorizontal: 28, marginTop: space.space4,
  },
  iosPickerWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    borderTopWidth: 1, paddingBottom: 28,
  },
  iosPickerActions: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  iosPickerBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  iosPickerBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
});
