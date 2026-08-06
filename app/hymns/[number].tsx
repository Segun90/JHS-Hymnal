import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Share, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Heart, Share2, Bookmark, ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';
import { space, type, fonts } from '@/theme/tokens';
import { getHymnWithStanzas } from '@/db/hymns';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useLibraryStore } from '@/stores/useLibraryStore';
import { useStatsStore } from '@/stores/useStatsStore';
import { StanzaView } from '@/components/StanzaView';
import { Toast } from '@/components/Toast';

export default function HymnViewScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { number } = useLocalSearchParams();
  const num = parseInt(number as string, 10);
  const hymnFontSize = useSettingsStore((s: any) => s.hymnFontSize);
  const store = useLibraryStore();
  const statsStore = useStatsStore();
  const sessionRef = useRef(0);

  const data = useMemo(() => getHymnWithStanzas(num), [num]);
  const [toastMsg, setToastMsg] = useState('');
  const [toastKey, setToastKey] = useState(0);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastKey((k: number) => k + 1);
  };

  useEffect(() => {
    if (!data) return;
    store.record({ itemType: 'hymn', hymnId: data.hymn.id, label: data.hymn.title });
    statsStore.recordActivity();
    sessionRef.current = statsStore.startSession('hymn', String(data.hymn.id));
    return () => {
      if (sessionRef.current) statsStore.endSession(sessionRef.current);
    };
  }, [data]);

  const isFav = useMemo(() => data && store.favorites.some((f: any) => f.hymnId === data.hymn.id), [store.favorites, data]);
  const isBm = useMemo(() => data && store.bookmarks.some((b: any) => b.hymnId === data.hymn.id), [store.bookmarks, data]);
  const prevExists = num > 1;
  const nextExists = num < 376;

  const handlePrev = () => {
    if (num > 1) router.replace(`/hymns/${num - 1}` as any);
  };

  const handleNext = () => {
    if (num < 376) router.replace(`/hymns/${num + 1}` as any);
  };

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={[type.titleMedium, { color: palette.text }]}>Hymn not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: space.space4 }}>
          <Text style={{ color: palette.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { hymn, stanzas } = data;

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={[styles.appbar, { backgroundColor: palette.surface, shadowColor: palette.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.appbarTitle, { color: palette.text }]}>№ {hymn.number}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => {
            store.toggleBookmark({ itemType: 'hymn', hymnId: hymn.id, label: hymn.title }, `${hymn.title} \u00B7 Hymn ${hymn.number}`);
            showToast(isBm ? 'Bookmark removed' : 'Bookmarked!');
          }}
          style={styles.iconBtn}
        >
          <Bookmark size={20} color={isBm ? palette.primary : palette.textSecondary} fill={isBm ? palette.primary : 'transparent'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            store.toggleFavorite({ itemType: 'hymn', hymnId: hymn.id });
            showToast(isFav ? 'Removed from favorites' : 'Added to favorites');
          }}
          style={styles.iconBtn}
        >
          <Heart size={22} color={isFav ? palette.primary : palette.textSecondary} fill={isFav ? palette.primary : 'transparent'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            const text = stanzas.map((s: any) => (s.stanzaType === 'chorus' ? `Chorus: ${s.text}` : `${s.stanzaNumber}. ${s.text}`)).join('\n\n');
            Share.share({ message: `${hymn.title}\n\n${text}\n\nHymn ${hymn.number} \u00B7 J.H.S Hymnal` });
          }}
          style={styles.iconBtn}
        >
          <Share2 size={22} color={palette.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(50).springify().damping(15)}>
          <View style={styles.hymnHead}>
            <View style={[styles.numbadge, { borderColor: palette.primary }]}>
              <Text style={[styles.numbadgeText, { color: palette.primary }]}>{hymn.number}</Text>
            </View>
            <Text style={[styles.hymnTitle, { color: palette.text }]}>{hymn.title}</Text>
            <Text style={[styles.hymnCap, { color: palette.textSecondary }]}>
              {hymn.sectionName ?? 'Hymn'} · J.H.S Hymnal
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify().damping(15)}>
          {stanzas.map((stanza: any) => (
            <StanzaView
              key={stanza.id}
              stanzaType={stanza.stanzaType}
              stanzaNumber={stanza.stanzaNumber}
              text={stanza.text}
              fontSize={hymnFontSize}
            />
          ))}
        </Animated.View>
      </ScrollView>

      <View style={[styles.miniBar, { backgroundColor: palette.surface, borderTopColor: palette.border }]}>
        <TouchableOpacity onPress={handlePrev} disabled={!prevExists} style={[styles.iconBtn, !prevExists && { opacity: 0.3 }]}>
          <ChevronLeft size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.miniBarText, { color: palette.textSecondary }]}>
          Hymn {hymn.number} of 376
        </Text>
        <TouchableOpacity onPress={handleNext} disabled={!nextExists} style={[styles.iconBtn, !nextExists && { opacity: 0.3 }]}>
          <ChevronRight size={24} color={palette.text} />
        </TouchableOpacity>
      </View>

      <Toast key={toastKey} message={toastMsg} visible={!!toastMsg} onDismiss={() => setToastMsg('')} />
    </View>
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
  appbarTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  hymnHead: { alignItems: 'center', paddingHorizontal: space.screenPadding, paddingVertical: space.space4 },
  numbadge: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  numbadgeText: { fontFamily: fonts.sansBold, fontSize: 15 },
  hymnTitle: { fontFamily: fonts.serifBold, fontSize: 19, textAlign: 'center', letterSpacing: 0.4 },
  hymnCap: { fontFamily: fonts.sansMedium, fontSize: 11, marginTop: 3 },
  miniBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  miniBarText: { fontFamily: fonts.sansMedium, fontSize: 11 },
});
