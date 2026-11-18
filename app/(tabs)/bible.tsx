import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Search as SearchIcon, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';
import { space, fonts } from '@/theme/tokens';
import { useTabBarClearance } from '@/utils/layout';
import { getBooks } from '@/db/bible';
import { SegmentedControl } from '@/components/SegmentedControl';
import { AppBar } from '@/components/AppBar';
import type { BibleBook } from '@/types';

export default function BibleScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const tabBarClearance = useTabBarClearance();
  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const allBooks = useMemo(() => getBooks(), []);
  const otBooks = useMemo(() => allBooks.filter((b: BibleBook) => b.testament === 'OT'), [allBooks]);
  const ntBooks = useMemo(() => allBooks.filter((b: BibleBook) => b.testament === 'NT'), [allBooks]);
  const activeBooks = tab === 0 ? otBooks : ntBooks;

  const displayed = useMemo(() => {
    if (!searchQuery.trim()) return activeBooks;
    const lower = searchQuery.toLowerCase();
    return activeBooks.filter((b: BibleBook) => b.name.toLowerCase().includes(lower) || b.abbreviation.toLowerCase().includes(lower));
  }, [activeBooks, searchQuery]);

  const tabLabel = tab === 0 ? 'OLD TESTAMENT' : 'NEW TESTAMENT';

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <AppBar 
        title="Holy Bible" 
        variant="primary" 
        trailing={
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/search')}>
            <SearchIcon size={22} color={palette.onPrimary} />
          </TouchableOpacity>
        }
      />

      <SegmentedControl
        segments={['Old Testament', 'New Testament']}
        selectedIndex={tab}
        onSelect={setTab}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: tabBarClearance }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionHeader, { color: palette.textSecondary }]}>
          {tabLabel} · {activeBooks.length} BOOKS
        </Text>

        {displayed.map((book: BibleBook, index: number) => (
          <Animated.View
            key={book.id}
            entering={FadeInUp.delay(Math.min(index * 30, 400)).springify().damping(15)}
          >
            <TouchableOpacity
              style={[styles.bookRow, { borderBottomColor: palette.border }]}
              onPress={() => router.push(`/bible/${book.id}`)}
            >
              <View style={[styles.abbrev, { backgroundColor: palette.surfaceAlt }]}>
                <Text style={[styles.abbrevText, { color: palette.text }]}>{book.abbreviation}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bookName, { color: palette.text }]}>{book.name}</Text>
                <Text style={[styles.bookCap, { color: palette.textSecondary }]}>{book.chapterCount} chapters</Text>
              </View>
              <ChevronRight size={18} color={palette.textSecondary} />
            </TouchableOpacity>
          </Animated.View>
        ))}
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
  sectionHeader: {
    fontFamily: fonts.sansBold, fontSize: 10.5, letterSpacing: 0.8,
    paddingHorizontal: space.screenPadding, paddingTop: space.space3, paddingBottom: space.space2,
    textTransform: 'uppercase',
  },
  bookRow: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingHorizontal: space.screenPadding, paddingVertical: 12,
    borderBottomWidth: 1, minHeight: 60,
  },
  abbrev: {
    width: 36, height: 36, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  abbrevText: { fontFamily: fonts.sansBold, fontSize: 12 },
  bookName: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  bookCap: { fontFamily: fonts.sansMedium, fontSize: 11, marginTop: 1 },
});
