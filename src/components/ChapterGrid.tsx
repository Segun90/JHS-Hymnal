import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fonts, space } from '../theme/tokens';

interface ChapterGridProps {
  chapterCount: number;
  currentChapter: number;
  bookmarkedChapters: number[];
  onChapterPress: (chapter: number) => void;
}

export function ChapterGrid({ chapterCount, currentChapter, bookmarkedChapters, onChapterPress }: ChapterGridProps) {
  const { palette } = useTheme();
  const chapters = Array.from({ length: chapterCount }, (_, i) => i + 1);

  return (
    <View style={styles.grid}>
      {chapters.map((ch) => {
        const isCurrent = ch === currentChapter;
        const isBookmarked = bookmarkedChapters.includes(ch);
        return (
          <TouchableOpacity
            key={ch}
            onPress={() => onChapterPress(ch)}
            accessibilityLabel={`Chapter ${ch}${isCurrent ? ', current' : ''}`}
            accessibilityRole="button"
            style={[
              styles.cell,
              {
                backgroundColor: isCurrent ? palette.primary : palette.surface,
                borderColor: isCurrent ? palette.primary : palette.border,
              },
            ]}
          >
            <Text style={[
              styles.cellText,
              { color: isCurrent ? palette.onPrimary : palette.text },
            ]}>
              {ch}
            </Text>
            {isBookmarked && !isCurrent && (
              <View style={[styles.dot, { backgroundColor: palette.highlight }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    padding: space.screenPadding,
  },
  cell: {
    width: '14.5%', aspectRatio: 1, borderRadius: 9,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  cellText: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  dot: {
    position: 'absolute', top: 4, right: 4,
    width: 7, height: 7, borderRadius: 4,
  },
});
