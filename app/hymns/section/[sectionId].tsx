import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Text } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { space, fonts } from '@/theme/tokens';
import { useScreenClearance } from '@/utils/layout';
import { getHymnsBySection, getSections } from '@/db/hymns';
import { useLibraryStore } from '@/stores/useLibraryStore';
import { HymnListItem } from '@/components/HymnListItem';

export default function SectionListScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const screenClearance = useScreenClearance();
  const { sectionId } = useLocalSearchParams<{ sectionId: string }>();
  const sid = parseInt(sectionId, 10);

  const sections = useMemo(() => getSections(), []);
  const section = useMemo(() => sections.find((s) => s.id === sid), [sections, sid]);
  const hymns = useMemo(() => getHymnsBySection(sid), [sid]);
  const favorites = useLibraryStore((s) => s.favorites);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={[styles.appbar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeft size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.serifTitle, { color: palette.text }]}>{section?.name ?? 'Section'}</Text>
        <View style={{ flex: 1 }} />
        <Text style={[styles.countText, { color: palette.textSecondary }]}>{hymns.length} hymns</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 4, paddingBottom: screenClearance }}>
        {hymns.map((hymn: any) => (
          <HymnListItem
            key={hymn.id}
            number={hymn.number}
            title={hymn.title}
            firstLine={hymn.firstLine}
            isFavorited={favorites.some((f: any) => f.hymnId === hymn.id)}
            onPress={() => router.push(`/hymns/${hymn.number}`)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = {
  appbar: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    paddingHorizontal: space.screenPadding, paddingTop: 56, paddingBottom: 10,
    borderBottomWidth: 1,
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center' as const, justifyContent: 'center' as const },
  serifTitle: { fontFamily: fonts.serifSemiBold, fontSize: 18, flex: 1 },
  countText: { fontFamily: fonts.sansMedium, fontSize: 11 },
};
