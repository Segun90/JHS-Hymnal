import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { space, fonts } from '@/theme/tokens';
import { getBook, getChapterCount } from '@/db/bible';
import { useLibraryStore } from '@/stores/useLibraryStore';
import { ChapterGrid } from '@/components/ChapterGrid';

export default function ChapterGridScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { bookId } = useLocalSearchParams();
  const bid = parseInt(bookId as string, 10);
  const book = useMemo(() => getBook(bid), [bid]);
  const chapterCount = useMemo(() => bid ? getChapterCount(bid) : 0, [bid]);
  const bookmarks = useLibraryStore((s: any) => s.bookmarks);

  const bookmarkedChapters = useMemo(() => {
    return bookmarks
      .filter((b: any) => b.itemType === 'bible' && b.bibleRef?.startsWith(`${bid}:`))
      .map((b: any) => {
        const [, ch] = b.bibleRef!.split(':');
        return parseInt(ch, 10);
      })
      .filter((ch: number) => !isNaN(ch));
  }, [bookmarks, bid]);

  if (!book) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.background }}>
        <View style={[styles.appbar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ChevronLeft size={24} color={palette.text} />
          </TouchableOpacity>
          <Text style={[styles.appbarTitle, { color: palette.text }]}>Book not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={[styles.appbar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeft size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.serifTitle, { color: palette.text }]}>{book.name}</Text>
      </View>
      <ChapterGrid
        chapterCount={chapterCount}
        currentChapter={1}
        bookmarkedChapters={bookmarkedChapters}
        onChapterPress={(ch: number) => router.push(`/bible/${bid}/${ch}`)}
      />
      <View style={[styles.miniBar, { backgroundColor: palette.surface, borderTopColor: palette.border }]}>
        <View />
        <Text style={[styles.miniBarText, { color: palette.textSecondary }]}>
          Tap a chapter to read · {chapterCount} chapters
        </Text>
        <View />
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
  serifTitle: { fontFamily: fonts.serifSemiBold, fontSize: 18, flex: 1 },
  miniBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: space.screenPadding,
    borderTopWidth: 1,
  },
  miniBarText: { fontFamily: fonts.sansMedium, fontSize: 11 },
});
