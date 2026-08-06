import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { space, fonts } from '@/theme/tokens';
import { useScreenClearance } from '@/utils/layout';
import { getIndexEntries } from '@/db/hymns';
import { SegmentedControl } from '@/components/SegmentedControl';

const tabs = ['Topical', 'General', 'First Lines'];

export default function IndexesScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const screenClearance = useScreenClearance();
  const [tab, setTab] = useState(0);
  const types = ['topical', 'general', 'first_lines'] as const;
  const entries = useMemo(() => getIndexEntries(types[tab]), [tab]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={[styles.appbar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeft size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.appbarTitle, { color: palette.text }]}>Indexes</Text>
      </View>
      <SegmentedControl segments={tabs} selectedIndex={tab} onSelect={setTab} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 6, paddingBottom: screenClearance }}>
        {entries.map((entry: any) => (
          <TouchableOpacity
            key={entry.id}
            style={[styles.row, { borderBottomColor: palette.border }]}
            onPress={() => router.push(`/hymns/${entry.hymnId}`)}
          >
            <Text style={[styles.entryText, { color: palette.text }]} numberOfLines={1}>
              {entry.entryText}
            </Text>
            <Text style={[styles.entryNum, { color: palette.highlight }]}>
              {entry.hymnId}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: space.screenPadding, paddingVertical: space.space3,
    borderBottomWidth: 1, minHeight: 48,
  },
  entryText: { flex: 1, fontFamily: fonts.serifRegular, fontSize: 13 },
  entryNum: { fontFamily: fonts.sansBold, fontSize: 12.5 },
});
