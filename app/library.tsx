import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Text, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, BookOpen, Music, FileText, Trash2, Search, X, Share2, ArrowUpDown, Check } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { space, fonts, radius } from '@/theme/tokens';
import { useScreenClearance } from '@/utils/layout';
import { useLibraryStore } from '@/stores/useLibraryStore';
import { SegmentedControl } from '@/components/SegmentedControl';
import { formatBibleRef } from '@/utils/references';
import { UpcomingCard } from '@/components/UpcomingCard';
import { getUpcomingContent } from '@/data/upcomingContent';
import { AppBar } from '@/components/AppBar';
import type { LibraryItem, Note, HistoryItem } from '@/types';

const TABS = ['Bookmarks', 'Favorites', 'Notes', 'History'];

type SortMode = 'newest' | 'oldest' | 'alpha' | 'recent';

export default function LibraryScreen() {
  const { palette } = useTheme();
  const screenClearance = useScreenClearance();
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const searchRef = useRef<TextInput>(null);
  const store = useLibraryStore();

  const rawData = useMemo(() => {
    switch (tab) {
      case 0: return store.bookmarks as any[];
      case 1: return store.favorites as any[];
      case 2: return store.notes as any[];
      case 3: return store.history as any[];
      default: return [];
    }
  }, [tab, store.bookmarks, store.favorites, store.notes, store.history]);

  const filtered = useMemo(() => {
    let items = rawData;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((item: any) => {
        const ref = item.bibleRef?.toLowerCase() ?? '';
        const body = item.body?.toLowerCase() ?? '';
        const label = item.label?.toLowerCase() ?? '';
        return ref.includes(q) || body.includes(q) || label.includes(q);
      });
    }
    return items;
  }, [rawData, search]);

  const sorted = useMemo(() => {
    const items = [...filtered];
    switch (sortMode) {
      case 'newest': return items.sort((a, b) => (b.createdAt ?? b.viewedAt ?? 0) - (a.createdAt ?? a.viewedAt ?? 0));
      case 'oldest': return items.sort((a, b) => (a.createdAt ?? a.viewedAt ?? 0) - (b.createdAt ?? b.viewedAt ?? 0));
      case 'alpha':
        return items.sort((a, b) => {
          const aRef = a.bibleRef ?? (a.hymnId != null ? `Hymn ${a.hymnId}` : (a.label ?? 'Legacy Hymn'));
          const bRef = b.bibleRef ?? (b.hymnId != null ? `Hymn ${b.hymnId}` : (b.label ?? 'Legacy Hymn'));
          return aRef.localeCompare(bRef);
        });
      case 'recent':
        return items.sort((a, b) => (b.updatedAt ?? b.viewedAt ?? 0) - (a.updatedAt ?? a.viewedAt ?? 0));
      default: return items;
    }
  }, [filtered, sortMode]);

  useEffect(() => { setSel(new Set()); setSelecting(false); }, [tab]);

  const toggleSel = (id: number) => {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSel = () => {
    if (sel.size === 0) return;
    Alert.alert('Delete', `Delete ${sel.size} item${sel.size > 1 ? 's' : ''}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        for (const id of sel) {
          if (tab === 0) await store.removeBookmark(id);
          else if (tab === 1) await store.removeFavorite(id);
          else if (tab === 2) await store.deleteNote(id);
          else if (tab === 3) await store.deleteHistoryItem(id);
        }
        setSel(new Set());
        setSelecting(false);
      }},
    ]);
  };

  const handleDeleteOne = (item: any) => {
    const name = tab === 0 ? 'Bookmark' : tab === 1 ? 'Favorite' : tab === 2 ? 'Note' : 'History item';
    Alert.alert(`Remove ${name}`, `Remove this ${name.toLowerCase()}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        if (tab === 0) store.removeBookmark(item.id);
        else if (tab === 1) store.removeFavorite(item.id);
        else if (tab === 2) store.deleteNote(item.id);
        else if (tab === 3) store.deleteHistoryItem(item.id);
      }},
    ]);
  };

  const handleOpen = (item: any) => {
    const ref = item.bibleRef;
    const hid = item.hymnId;
    if (ref) {
      const parts = ref.split(':');
      if (parts.length >= 2) router.push(`/bible/${parts[0]}/${parts[1]}`);
    } else if (hid != null && hid > 0) {
      router.push(`/hymns/${hid}`);
    }
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isBible = !!item.bibleRef;
    const isNote = tab === 2;
    const refStr = item.bibleRef
      ? formatBibleRef(item.bibleRef)
      : (item.hymnId != null ? `Hymn ${item.hymnId}` : (item.label ?? 'Legacy Hymn'));
    const date = new Date(item.createdAt ?? item.updatedAt ?? item.viewedAt ?? Date.now());
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const preview = item.body ?? item.previewText ?? '';
    const selected = sel.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: palette.border }, selected && { backgroundColor: palette.surfaceAlt }]}
        onPress={() => selecting ? toggleSel(item.id) : handleOpen(item)}
        onLongPress={() => { setSelecting(true); toggleSel(item.id); }}
        activeOpacity={0.7}
      >
        <View style={styles.iconBox}>
          {isNote ? (
            <FileText size={18} color={palette.primary} />
          ) : isBible ? (
            <BookOpen size={18} color={palette.primary} />
          ) : (
            <Music size={18} color={palette.primary} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={1}>
            {refStr}
          </Text>
          {preview ? (
            <Text style={[styles.rowSub, { color: palette.textSecondary }]} numberOfLines={2}>
              {preview}
            </Text>
          ) : null}
          <Text style={[styles.rowDate, { color: palette.textSecondary }]}>
            {dateStr}
          </Text>
        </View>
        {selecting ? (
          <View style={[styles.checkbox, selected && { backgroundColor: palette.primary, borderColor: palette.primary }]}>
            {selected && <Check size={14} color={palette.onPrimary} />}
          </View>
        ) : tab < 3 ? (
          <TouchableOpacity onPress={() => handleDeleteOne(item)} style={styles.miniBtn} hitSlop={8}>
            <Trash2 size={15} color={palette.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    );
  }, [tab, palette, selecting, sel, store]);

  const keyExtractor = useCallback((item: any, i: number) => String(item.id ?? i), []);

  const emptyMsg = (() => {
    if (search.trim()) return 'No results found';
    switch (tab) {
      case 0: return 'No bookmarks yet\nTap the bookmark icon in the Bible reader or hymn view to add one.';
      case 1: return 'No favorites yet\nTap the heart icon to mark your favorites.';
      case 2: return 'No notes created yet\nLong-press a verse and choose "Add Note" to get started.';
      case 3: return 'No reading history yet\nStart reading the Bible or hymns to build your history.';
      default: return '';
    }
  })();

  const sorters: { key: SortMode; label: string }[] = [
    { key: 'newest', label: 'Newest' },
    { key: 'oldest', label: 'Oldest' },
    { key: 'alpha', label: 'A\u2013Z' },
    { key: 'recent', label: 'Recent' },
  ];

  const upcoming = useMemo(() => getUpcomingContent(), []);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <AppBar 
        title="My Library" 
        variant="primary" 
        onBack={() => router.back()}
        trailing={
          <>
            {selecting && sel.size > 0 && (
              <TouchableOpacity onPress={handleDeleteSel} style={styles.iconBtn}>
                <Trash2 size={20} color={palette.error} />
              </TouchableOpacity>
            )}
            {selecting && (
              <TouchableOpacity onPress={() => { setSel(new Set()); setSelecting(false); }} style={styles.iconBtn}>
                <X size={20} color={palette.onPrimary} />
              </TouchableOpacity>
            )}
          </>
        }
      />

      <FlatList
        data={sorted}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={
          <View>
            {upcoming.length > 0 && (
              <View style={styles.upcomingSection}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>Upcoming</Text>
                <View style={styles.upcomingGrid}>
                  {upcoming.map((item) => (
                    <View key={item.id} style={styles.upcomingCardWrap}>
                      <UpcomingCard
                        item={item}
                        onPress={() => router.push(`/upcoming/${item.id}`)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            <SegmentedControl segments={TABS} selectedIndex={tab} onSelect={setTab} />

            <View style={[styles.toolbar, { borderBottomColor: palette.border }]}>
              <View style={[styles.searchWrap, { backgroundColor: palette.surfaceAlt }]}>
                <Search size={14} color={palette.textSecondary} />
                <TextInput
                  ref={searchRef}
                  style={[styles.searchInput, { color: palette.text }]}
                  value={search}
                  onChangeText={setSearch}
                  placeholder={`Search ${TABS[tab].toLowerCase()}...`}
                  placeholderTextColor={palette.textSecondary}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <X size={14} color={palette.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={styles.sortBtn}
                onPress={() => setSortMode(sorters[(sorters.findIndex((s) => s.key === sortMode) + 1) % sorters.length].key)}
              >
                <ArrowUpDown size={14} color={palette.textSecondary} />
                <Text style={[styles.sortLabel, { color: palette.textSecondary }]}>
                  {sorters.find((s) => s.key === sortMode)?.label ?? 'Newest'}
                </Text>
              </TouchableOpacity>
            </View>

            {sorted.length === 0 && (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: palette.textSecondary }]}>{emptyMsg}</Text>
              </View>
            )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: screenClearance }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={30}
        maxToRenderPerBatch={15}
        windowSize={7}
      />
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
  toolbar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: space.screenPadding, paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.rFull, paddingHorizontal: 12, height: 36,
  },
  searchInput: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 12.5, padding: 0 },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, height: 36, borderRadius: radius.rFull,
  },
  sortLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10.5 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: space.screenPadding * 2 },
  emptyText: { fontFamily: fonts.sansMedium, fontSize: 13, textAlign: 'center', lineHeight: 22 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: space.screenPadding, paddingVertical: 11,
    borderBottomWidth: 1, minHeight: 58,
  },
  iconBox: { width: 20, alignItems: 'center' },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 12.5 },
  rowSub: { fontFamily: fonts.sansMedium, fontSize: 11, marginTop: 1, lineHeight: 15 },
  rowDate: { fontFamily: fonts.sansMedium, fontSize: 9.5, marginTop: 2 },
  miniBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#9CA3AF',
    alignItems: 'center', justifyContent: 'center',
  },
  upcomingSection: {
    paddingHorizontal: space.screenPadding, paddingTop: space.space4, paddingBottom: space.space2,
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold, fontSize: 15, marginBottom: 12,
  },
  upcomingGrid: {
    flexDirection: 'column', gap: 16, alignItems: 'center',
  },
  upcomingCardWrap: {
    width: '100%',
  },
});
