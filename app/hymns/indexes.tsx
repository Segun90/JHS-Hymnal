import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { space, fonts } from '@/theme/tokens';
import { useScreenClearance } from '@/utils/layout';
import { getIndexEntries } from '@/db/hymns';
import { SegmentedControl } from '@/components/SegmentedControl';
import { AppBar } from '@/components/AppBar';
import type { IndexEntry } from '@/types';

const tabs = ['Topical', 'General', 'First Lines'];
const types = ['topical', 'general', 'first_lines'] as const;

export default function IndexesScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const screenClearance = useScreenClearance();
  const [tab, setTab] = useState(0);
  const entries = useMemo(() => getIndexEntries(types[tab]), [tab]);

  const renderItem = useCallback(
    ({ item }: { item: IndexEntry }) => {
      const targetNum = item.hymnNumber ?? item.hymnId;
      return (
        <TouchableOpacity
          style={[styles.row, { borderBottomColor: palette.border }]}
          onPress={() => router.push(`/hymns/${targetNum}`)}
        >
          <Text style={[styles.entryText, { color: palette.text }]} numberOfLines={1}>
            {item.entryText}
          </Text>
          <Text style={[styles.entryNum, { color: palette.highlight }]}>
            {targetNum}
          </Text>
        </TouchableOpacity>
      );
    },
    [palette.border, palette.text, palette.highlight, router]
  );

  const keyExtractor = useCallback((item: IndexEntry) => String(item.id), []);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <AppBar
        title="Indexes"
        variant="primary"
        onBack={() => router.back()}
      />
      <SegmentedControl segments={tabs} selectedIndex={tab} onSelect={setTab} />
      <FlatList
        style={{ flex: 1 }}
        data={entries}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 6, paddingBottom: screenClearance }}
        initialNumToRender={25}
        maxToRenderPerBatch={20}
        windowSize={7}
        removeClippedSubviews
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
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: space.screenPadding, paddingVertical: space.space3,
    borderBottomWidth: 1, minHeight: 48,
  },
  entryText: { flex: 1, fontFamily: fonts.serifRegular, fontSize: 13 },
  entryNum: { fontFamily: fonts.sansBold, fontSize: 12.5 },
});
