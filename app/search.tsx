import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, X, BookOpen, Music } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { space, fonts, gradients } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { useScreenClearance } from '@/utils/layout';
import { searchBible } from '@/db/bible';
import { searchHymns } from '@/db/hymns';
import { useStatsStore } from '@/stores/useStatsStore';

const CHIPS = ['All', 'Bible', 'Hymns'];

export default function SearchScreen() {
  const { palette } = useTheme();
  const screenClearance = useScreenClearance();
  const router = useRouter();
  const statsStore = useStatsStore();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState(0);
  const [results, setResults] = useState<{ bible: any[]; hymns: any[] }>({ bible: [], hymns: [] });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    recordedRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();
    const isNumeric = /^\d+$/.test(q);
    if (!q || (!isNumeric && q.length < 2)) {
      setResults({ bible: [], hymns: [] });
      return;
    }
    timerRef.current = setTimeout(() => {
      if (!recordedRef.current) {
        statsStore.recordSearch(q);
        statsStore.recordActivity();
        recordedRef.current = true;
      }
      const bible: any[] = [];
      const hymns: any[] = [];
      if (chip === 0 || chip === 1) {
        try { bible.push(...searchBible(q, 30)); } catch {}
      }
      if (chip === 0 || chip === 2) {
        try { hymns.push(...searchHymns(q, 20)); } catch {}
      }
      setResults({ bible, hymns });
    }, 250);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, chip]);

  const handleSelect = useCallback((item: any) => {
    if (item.source === 'bible') {
      const parts = item.bibleRef.split(':');
      if (parts.length >= 2) router.push(`/bible/${parts[0]}/${parts[1]}`);
    } else {
      router.push(`/hymns/${item.hymnNumber}`);
    }
  }, [router]);

  const totalResults = results.bible.length + results.hymns.length;

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={[styles.searchWrap, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={palette.text} />
        </TouchableOpacity>
        <View style={[styles.searchBar, { backgroundColor: palette.surfaceAlt }]}>
          <Search size={16} color={palette.textSecondary} />
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: palette.text }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search Bible & hymns..."
            placeholderTextColor={palette.textSecondary}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={16} color={palette.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.chips}>
        {CHIPS.map((label, i) => (
          <TouchableOpacity
            key={label}
            style={[
              styles.chip,
              { borderColor: palette.border },
              chip === i && { borderColor: palette.accent },
            ]}
            onPress={() => setChip(i)}
          >
            {chip === i && <LinearGradient colors={gradients.secondary} style={styles.chipFill} />}
            <Text style={[
              styles.chipText,
              { color: palette.textSecondary },
              chip === i && { color: palette.onAccent },
            ]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: screenClearance }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {query.trim().length > 0 && !/^\d+$/.test(query.trim()) && query.trim().length < 2 && (
          <Text style={[styles.hint, { color: palette.textSecondary }]}>Type at least 2 characters to search</Text>
        )}

        {totalResults === 0 && (/^\d+$/.test(query.trim()) || query.trim().length >= 2) && (
          <Text style={[styles.hint, { color: palette.textSecondary }]}>No results found</Text>
        )}

        {results.bible.length > 0 && (chip === 0 || chip === 1) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>
              BIBLE · {results.bible.length} {results.bible.length === 1 ? 'RESULT' : 'RESULTS'}
            </Text>
            {results.bible.map((item: any, i: number) => (
              <TouchableOpacity
                key={`b-${i}`}
                style={[styles.resultRow, { borderBottomColor: palette.border }]}
                onPress={() => handleSelect(item)}
              >
                <BookOpen size={16} color={palette.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.refText, { color: palette.primary }]}>
                    {item.bookName} {item.chapter}:{item.verse}
                  </Text>
                  <Text style={[styles.verseText, { color: palette.text }]} numberOfLines={2}>
                    {item.text}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {results.hymns.length > 0 && (chip === 0 || chip === 2) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>
              HYMNS · {results.hymns.length} {results.hymns.length === 1 ? 'RESULT' : 'RESULTS'}
            </Text>
            {results.hymns.map((item: any, i: number) => (
              <TouchableOpacity
                key={`h-${i}`}
                style={[styles.resultRow, { borderBottomColor: palette.border }]}
                onPress={() => handleSelect(item)}
              >
                <View style={[styles.numBadge, { borderColor: palette.primary }]}>
                  <Text style={[styles.numText, { color: palette.primary }]}>{item.hymnNumber}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.hymnTitle, { color: palette.text }]}>{item.hymnTitle}</Text>
                  <Text style={[styles.hymnText, { color: palette.textSecondary }]} numberOfLines={1}>
                    {item.text}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: space.space2, paddingTop: 54, paddingBottom: 8,
    borderBottomWidth: 1,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 999, paddingHorizontal: 14, height: 40,
  },
  input: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 13.5 },
  chips: {
    flexDirection: 'row', gap: 7,
    paddingHorizontal: space.screenPadding, paddingVertical: 10,
  },
  chip: {
    borderWidth: 1.5, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 5,
    overflow: 'hidden',
  },
  chipFill: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 999,
  },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 11 },
  hint: { textAlign: 'center', fontFamily: fonts.sansMedium, fontSize: 13, marginTop: 40 },
  section: { marginTop: space.space3 },
  sectionTitle: {
    fontFamily: fonts.sansBold, fontSize: 10.5, letterSpacing: 0.8,
    paddingHorizontal: space.screenPadding, paddingBottom: space.space2,
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: space.screenPadding, paddingVertical: 11,
    borderBottomWidth: 1, minHeight: 60,
  },
  refText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  verseText: { fontFamily: fonts.serifRegular, fontSize: 13, lineHeight: 19, marginTop: 2 },
  numBadge: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  numText: { fontFamily: fonts.sansBold, fontSize: 11 },
  hymnTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  hymnText: { fontFamily: fonts.sansMedium, fontSize: 11, marginTop: 2 },
});
