import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Share, Text, TextInput, Modal, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Bookmark, Heart, Share2, Settings2, Pencil } from 'lucide-react-native';
import { GestureDetector, Gesture, Directions } from 'react-native-gesture-handler';
import { useTheme } from '@/theme/ThemeContext';
import { space, fonts, radius } from '@/theme/tokens';
import { getChapter, getBook, getChapterCount } from '@/db/bible';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useLibraryStore } from '@/stores/useLibraryStore';
import { useStatsStore } from '@/stores/useStatsStore';
import { makeBibleRef, formatBibleRef } from '@/utils/references';
import { VerseText } from '@/components/VerseText';
import { ActionSheet } from '@/components/ActionSheet';
import { ReaderSettings } from '@/components/ReaderSettings';
import { Toast } from '@/components/Toast';
import { AppBar } from '@/components/AppBar';

export default function ReaderScreen() {
  const { palette, isDark } = useTheme();
  const router = useRouter();
  const { bookId, chapter } = useLocalSearchParams();
  const bid = parseInt(bookId as string, 10);
  const ch = parseInt(chapter as string, 10);
  const listRef = useRef<FlatList>(null);

  const readerFontSize = useSettingsStore((s: any) => s.readerFontSize);
  const readerLineHeight = useSettingsStore((s: any) => s.readerLineHeight);
  const readerLetterSpacing = useSettingsStore((s: any) => s.readerLetterSpacing);
  const setThemeMode = useSettingsStore((s: any) => s.setThemeMode);

  const store = useLibraryStore();
  const statsStore = useStatsStore();
  const sessionRef = useRef(0);

  const book = useMemo(() => getBook(bid), [bid]);
  const verses = useMemo(() => getChapter(bid, ch), [bid, ch]);
  const chapterCount = useMemo(() => getChapterCount(bid), [bid]);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastKey, setToastKey] = useState(0);

  const chapterRef = useMemo(() => makeBibleRef(bid, ch, 1).replace(/:1$/, ''), [bid, ch]);
  const chapterLabel = useMemo(() => `${book?.name} ${ch}`, [book, ch]);

  useEffect(() => {
    store.record({ itemType: 'bible', bibleRef: `${bid}:${ch}`, label: chapterLabel });
    statsStore.recordActivity();
    sessionRef.current = statsStore.startSession('bible', `${bid}:${ch}`);
    return () => {
      if (sessionRef.current) statsStore.endSession(sessionRef.current);
    };
  }, [bid, ch]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastKey((k: number) => k + 1);
  };

  const swipeLeft = Gesture.Fling().direction(Directions.LEFT).onEnd(() => {
    if (ch < chapterCount) {
      router.replace(`/bible/${bid}/${ch + 1}`);
    }
  });

  const swipeRight = Gesture.Fling().direction(Directions.RIGHT).onEnd(() => {
    if (ch > 1) {
      router.replace(`/bible/${bid}/${ch - 1}`);
    }
  });

  const composedGestures = Gesture.Exclusive(swipeLeft, swipeRight);

  const handlePrev = () => {
    if (ch > 1) router.replace(`/bible/${bid}/${ch - 1}` as any);
    else if (bid > 1) { const prev = getBook(bid - 1); if (prev) router.replace(`/bible/${bid - 1}/${prev.chapterCount}` as any); }
  };

  const handleNext = () => {
    if (book && ch < book.chapterCount) router.replace(`/bible/${bid}/${ch + 1}` as any);
    else if (bid < 66) router.replace(`/bible/${bid + 1}/1` as any);
  };

  const handleLongPress = useCallback((verseNum: number) => {
    setSelectedVerse(verseNum);
    setShowSheet(true);
  }, []);

  const targetRef = useMemo(() => {
    if (!selectedVerse) return null;
    return {
      itemType: 'bible' as const,
      bibleRef: makeBibleRef(bid, ch, selectedVerse),
    };
  }, [bid, ch, selectedVerse]);

  const getVerseText = () => {
    if (!selectedVerse) return '';
    const v = verses.find((v: any) => v.verse === selectedVerse);
    return v?.text ?? '';
  };

  const toggleBookmark = () => {
    if (!targetRef) return;
    const preview = getVerseText().substring(0, 80);
    store.toggleBookmark(targetRef, preview);
    showToast(store.isBookmarked(targetRef) ? 'Bookmarked!' : 'Bookmark removed');
    setShowSheet(false);
  };

  const toggleFavorite = () => {
    if (!targetRef) return;
    store.toggleFavorite(targetRef);
    showToast(store.isFavorite(targetRef) ? 'Favorited!' : 'Favorite removed');
    setShowSheet(false);
  };

  const shareVerse = () => {
    if (!targetRef) return;
    const ref = formatBibleRef(targetRef.bibleRef!);
    Share.share({ message: `"${getVerseText()}" \u2014 ${ref} (KJV)` });
    setShowSheet(false);
  };

  const openNote = () => {
    if (!targetRef) return;
    const existing = store.getNote(targetRef);
    setNoteText(existing?.body ?? '');
    setShowNoteModal(true);
    setShowSheet(false);
  };

  const saveNote = () => {
    if (!targetRef) return;
    if (!noteText.trim()) {
      Alert.alert('Empty Note', 'Write something before saving.');
      return;
    }
    store.saveNote(targetRef, noteText.trim());
    showToast('Note saved');
    setShowNoteModal(false);
    setNoteText('');
  };

  const deleteNote = () => {
    if (!targetRef) return;
    Alert.alert('Delete Note', 'Remove this note?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        store.saveNote(targetRef, '');
        showToast('Note deleted');
        setShowNoteModal(false);
      }},
    ]);
  };

  const bookmarkChapter = () => {
    const chapTarget: any = { itemType: 'bible', bibleRef: `${bid}:${ch}`, label: chapterLabel };
    const preview = `${book?.name} ${ch}`;
    store.toggleBookmark(chapTarget, preview);
    showToast(store.isBookmarked(chapTarget) ? 'Chapter bookmarked!' : 'Bookmark removed');
  };

  const actions = targetRef ? [
    {
      icon: <Bookmark size={20} color={palette.primary} />,
      label: store.isBookmarked(targetRef) ? 'Remove Bookmark' : 'Bookmark Verse',
      onPress: toggleBookmark,
    },
    {
      icon: <Heart size={20} color={palette.error} />,
      label: store.isFavorite(targetRef) ? 'Remove Favorite' : 'Favorite',
      onPress: toggleFavorite,
    },
    {
      icon: <Pencil size={20} color={palette.accent} />,
      label: store.getNote(targetRef)?.body ? 'Edit Note' : 'Add Note',
      onPress: openNote,
    },
    {
      icon: <Share2 size={20} color={palette.textSecondary} />,
      label: 'Share Verse',
      onPress: shareVerse,
    },
  ] : [];

  const renderVerse = useCallback(({ item }: { item: any }) => (
    <VerseText
      verseNumber={item.verse}
      text={item.text}
      fontSize={readerFontSize}
      lineHeight={readerLineHeight}
      letterSpacing={readerLetterSpacing}
      isSelected={selectedVerse === item.verse}
      onLongPress={() => handleLongPress(item.verse)}
    />
  ), [readerFontSize, readerLineHeight, readerLetterSpacing, selectedVerse, handleLongPress]);

  const keyExtractor = useCallback((item: any) => String(item.id), []);

  return (
    <GestureDetector gesture={composedGestures}>
      <View style={{ flex: 1, backgroundColor: palette.background }}>
        <AppBar 
        title={`${book?.name} ${ch}`} 
        variant="primary" 
        onBack={() => router.back()}
        serif
        trailing={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={bookmarkChapter} style={styles.iconBtn}>
              <Bookmark size={18} color={palette.onPrimary} fill={store.isBookmarked({ itemType: 'bible', bibleRef: `${bid}:${ch}` }) ? palette.onPrimary : 'transparent'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/search')}>
              <Text style={{ fontSize: 22, color: palette.onPrimary, fontFamily: fonts.sansSemiBold }}>⌕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSettings(true)}>
              <Settings2 size={20} color={palette.onPrimary} />
            </TouchableOpacity>
          </View>
        }
      />

      <FlatList
        ref={listRef}
        data={verses}
        keyExtractor={keyExtractor}
        renderItem={renderVerse}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        initialNumToRender={25}
        maxToRenderPerBatch={12}
        windowSize={9}
      />

      <View style={[styles.miniBar, { backgroundColor: palette.surface, borderTopColor: palette.border }]}>
        <TouchableOpacity onPress={handlePrev} style={styles.iconBtn}>
          <ChevronLeft size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.miniBarText, { color: palette.textSecondary }]}>
          {book?.name} {ch} of {book?.chapterCount ?? '?'}
        </Text>
        <TouchableOpacity onPress={handleNext} style={styles.iconBtn}>
          <ChevronRight size={24} color={palette.text} />
        </TouchableOpacity>
      </View>

      <ActionSheet
        visible={showSheet}
        title={targetRef ? formatBibleRef(targetRef.bibleRef!) : ''}
        subtitle={`"${getVerseText().substring(0, 60)}${getVerseText().length > 60 ? '...' : ''}"`}
        actions={actions}
        onCancel={() => setShowSheet(false)}
      />

      <ReaderSettings
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onToggleTheme={() => setThemeMode(isDark ? 'light' : 'dark')}
      />

      <Modal visible={showNoteModal} transparent animationType="fade" onRequestClose={() => setShowNoteModal(false)}>
        <TouchableOpacity style={styles.noteScrim} activeOpacity={1} onPress={() => setShowNoteModal(false)}>
          <View />
        </TouchableOpacity>
        <View style={[styles.notePanel, { backgroundColor: palette.surface }]}>
          <Text style={[styles.noteTitle, { color: palette.text }]}>
            {targetRef ? formatBibleRef(targetRef.bibleRef!) : 'Note'}
          </Text>
          <TextInput
            style={[styles.noteInput, { backgroundColor: palette.background, color: palette.text, borderColor: palette.border }]}
            value={noteText}
            onChangeText={setNoteText}
            placeholder="Write your note..."
            placeholderTextColor={palette.textSecondary}
            multiline
            textAlignVertical="top"
            autoFocus
          />
          <Text style={[styles.noteCount, { color: palette.textSecondary }]}>
            {noteText.length} character{noteText.length !== 1 ? 's' : ''}
          </Text>
          <View style={styles.noteActions}>
            {store.getNote(targetRef ?? { itemType: 'bible', bibleRef: '' })?.body ? (
              <TouchableOpacity onPress={deleteNote} style={[styles.noteBtn, { backgroundColor: palette.error }]}>
                <Text style={[styles.noteBtnText, { color: '#fff' }]}>Delete</Text>
              </TouchableOpacity>
            ) : null}
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => setShowNoteModal(false)} style={[styles.noteBtn, { backgroundColor: palette.surfaceAlt }]}>
              <Text style={[styles.noteBtnText, { color: palette.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveNote} style={[styles.noteBtn, { backgroundColor: palette.accent }]}>
              <Text style={[styles.noteBtnText, { color: palette.onAccent }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast key={toastKey} message={toastMsg} visible={!!toastMsg} onDismiss={() => setToastMsg('')} />
    </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  appbar: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: space.screenPadding, paddingTop: 56, paddingBottom: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  serifTitle: { fontFamily: fonts.serifSemiBold, fontSize: 18 },
  listContent: {
    paddingHorizontal: space.readerPadding,
    paddingTop: space.readerPadding,
    paddingBottom: space.readerBottomPadding,
  },
  miniBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  miniBarText: { fontFamily: fonts.sansMedium, fontSize: 11 },
  noteScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  notePanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: radius.r3,
    borderTopRightRadius: radius.r3,
    padding: space.screenPadding,
    paddingBottom: 40,
  },
  noteTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, marginBottom: space.space4 },
  noteInput: {
    fontFamily: fonts.serifRegular,
    fontSize: 15, lineHeight: 24,
    borderRadius: radius.r2,
    borderWidth: 1,
    padding: space.space3,
    minHeight: 140,
    maxHeight: 260,
  },
  noteCount: { fontFamily: fonts.sansMedium, fontSize: 10.5, marginTop: 6, textAlign: 'right' },
  noteActions: { flexDirection: 'row', gap: 10, marginTop: space.space4, alignItems: 'center' },
  noteBtn: {
    borderRadius: radius.r2,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  noteBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
});
