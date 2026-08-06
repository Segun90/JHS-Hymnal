import React, { useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Settings, User, BarChart2, Heart, BookOpen, Download, Bell, Sun, Moon, Bookmark, Clock, Search, FileText, History, Music, Book } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useStatsStore } from '@/stores/useStatsStore';
import { space, fonts, brand } from '@/theme/tokens';
import { useTabBarClearance } from '@/utils/layout';

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${h}h ${rem}m`;
}

export default function ProfileScreen() {
  const { palette, isDark } = useTheme();
  const tabBarClearance = useTabBarClearance();
  const router = useRouter();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const statsStore = useStatsStore();

  useEffect(() => {
    statsStore.hydrate();
  }, []);

  useFocusEffect(useCallback(() => {
    statsStore.refresh();
  }, []));

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const themeLabel = themeMode === 'system' ? 'Auto' : themeMode === 'dark' ? 'Dark' : 'Light';
  const ThemeIcon = isDark ? Moon : Sun;
  const themeAccent = isDark ? brand.gold : brand.red;

  const joinYear = statsStore.joinDate.slice(0, 4);

  const statCards = [
    { icon: BarChart2, color: palette.highlight, value: `${statsStore.streakCurrent}`, label: 'Day Streak' },
    { icon: Clock, color: palette.primary, value: formatTime(statsStore.totalSeconds), label: 'Reading Time' },
    { icon: Heart, color: palette.error, value: `${statsStore.favorites}`, label: 'Favorites' },
    { icon: BookOpen, color: palette.success, value: `${statsStore.biblePercentage}%`, label: 'Bible Read' },
  ];

  const detailItems = [
    { icon: Book, label: 'Books Completed', value: `${statsStore.booksCompleted} / 66` },
    { icon: BookOpen, label: 'Chapters Read', value: `${statsStore.chaptersRead} / ${statsStore.totalChapters}` },
    { icon: Bookmark, label: 'Bookmarks', value: `${statsStore.bibleBookmarks} Bible · ${statsStore.hymnBookmarks} Hymns` },
    { icon: Music, label: 'Hymns Opened', value: `${statsStore.uniqueHymns} / ${statsStore.totalHymns} unique` },
    { icon: FileText, label: 'Notes', value: `${statsStore.notesCount}` },
    { icon: History, label: 'History', value: `${statsStore.historyCount} entries` },
    { icon: Search, label: 'Searches', value: `${statsStore.searchTotal} total` },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={[styles.appbar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <Text style={[styles.appbarTitle, { color: palette.text }]}>Profile</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings')}>
          <Settings size={22} color={palette.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: tabBarClearance }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(50).springify().damping(15)}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: palette.surfaceAlt }]}>
              <User size={40} color={palette.primary} />
            </View>
            <Text style={[styles.profileName, { color: palette.text, marginTop: space.space3 }]}>Worshipper</Text>
            <Text style={[styles.profileSub, { color: palette.textSecondary }]}>Joined {joinYear}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify().damping(15)}>
          <View style={styles.statsRow}>
            {statCards.map((s, i) => (
              <View key={i} style={[styles.statCard, { backgroundColor: palette.surface }]}>
                <s.icon size={22} color={s.color} />
                <Text style={[styles.statNumber, { color: palette.text, marginTop: space.space2 }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: palette.textSecondary }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).springify().damping(15)}>
          <Text style={[styles.sectionHeader, { color: palette.textSecondary }]}>DETAILS</Text>
          <View style={[styles.menuCard, { backgroundColor: palette.surface }]}>
            {detailItems.map((item, i) => (
              <View
                key={i}
                style={[styles.menuRow, i < detailItems.length - 1 && { borderBottomColor: palette.border, borderBottomWidth: 1 }]}
              >
                <item.icon size={18} color={palette.textSecondary} />
                <Text style={[styles.menuLabel, { color: palette.text, flex: 1, marginLeft: space.space3 }]}>{item.label}</Text>
                <Text style={[styles.menuValue, { color: palette.textSecondary }]}>{item.value}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify().damping(15)}>
          <Text style={[styles.sectionHeader, { color: palette.textSecondary, marginTop: space.space5 }]}>PREFERENCES</Text>
          <View style={[styles.menuCard, { backgroundColor: palette.surface }]}>
            <TouchableOpacity style={[styles.menuRow, { borderBottomColor: palette.border, borderBottomWidth: 1 }]} onPress={toggleTheme} activeOpacity={0.7}>
              <ThemeIcon size={20} color={themeAccent} />
              <Text style={[styles.menuLabel, { color: palette.text, flex: 1, marginLeft: space.space3 }]}>Theme</Text>
              <Text style={[styles.menuValue, { color: palette.textSecondary }]}>{themeLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuRow, { borderBottomColor: palette.border, borderBottomWidth: 1 }]}
              onPress={() => router.push('/reminders')}
              activeOpacity={0.7}
            >
              <Bell size={20} color={palette.textSecondary} />
              <Text style={[styles.menuLabel, { color: palette.text, flex: 1, marginLeft: space.space3 }]}>Notifications</Text>
              <Text style={[styles.menuValue, { color: palette.textSecondary }]}>›</Text>
            </TouchableOpacity>
            <View style={styles.menuRow}>
              <Download size={20} color={palette.textSecondary} />
              <Text style={[styles.menuLabel, { color: palette.text, flex: 1, marginLeft: space.space3 }]}>Downloads</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(250).springify().damping(15)}>
          <Text style={[styles.versionText, { color: palette.textSecondary }]}>v{statsStore.appVersion}</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  appbar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: space.screenPadding, paddingTop: 56, paddingBottom: 10,
    borderBottomWidth: 1,
  },
  appbarTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  profileHeader: { alignItems: 'center', marginVertical: space.space6 },
  avatar: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontFamily: fonts.sansSemiBold, fontSize: 20 },
  profileSub: { fontFamily: fonts.sansMedium, fontSize: 14 },
  statsRow: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: space.screenPadding,
    gap: space.space2, marginBottom: space.space6,
  },
  statCard: {
    width: '48%', alignItems: 'center', borderRadius: 12,
    paddingVertical: space.space5, paddingHorizontal: space.space2,
  },
  statNumber: { fontFamily: fonts.sansSemiBold, fontSize: 22 },
  statLabel: { fontFamily: fonts.sansMedium, fontSize: 12, marginTop: space.space1 },
  sectionHeader: {
    fontFamily: fonts.sansBold, fontSize: 10.5, letterSpacing: 0.8,
    paddingHorizontal: space.screenPadding + 4, marginBottom: space.space2,
  },
  menuCard: {
    marginHorizontal: space.screenPadding, borderRadius: 12, overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space.space4, paddingVertical: space.space3,
  },
  menuLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  menuValue: { fontFamily: fonts.sansMedium, fontSize: 11 },
  versionText: {
    fontFamily: fonts.sansMedium, fontSize: 11, textAlign: 'center',
    marginTop: space.space6,
  },
});
