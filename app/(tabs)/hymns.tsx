import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Search as SearchIcon, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';
import { space, fonts } from '@/theme/tokens';
import { useTabBarClearance } from '@/utils/layout';
import { getSections } from '@/db/hymns';
import { NumberPad } from '@/components/NumberPad';
import type { HymnSection } from '@/types';

export default function HymnsScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const tabBarClearance = useTabBarClearance();
  const sections = useMemo(() => getSections(), []);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={[styles.appbar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <Text style={[styles.appbarTitle, { color: palette.text }]}>J.H.S Hymnal</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/search')}>
          <SearchIcon size={22} color={palette.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: tabBarClearance }}
        showsVerticalScrollIndicator={false}
      >
        <NumberPad onGo={(num: number) => router.push(`/hymns/${num}`)} />

        <Text style={[styles.sectionHeader, { color: palette.textSecondary }]}>
          BROWSE BY TOPIC · {sections.length} SECTIONS
        </Text>

        {sections.map((section, index) => (
          <Animated.View
            key={section.id}
            entering={FadeInUp.delay(Math.min(100 + index * 30, 500)).springify().damping(15)}
          >
            <TouchableOpacity
              style={[styles.topicRow, { borderBottomColor: palette.border }]}
              onPress={() => router.push(`/hymns/section/${section.id}`)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.topicName, { color: palette.text }]}>{section.name}</Text>
                <Text style={[styles.topicCap, { color: palette.textSecondary }]}>
                  Hymns {getHymnRange(sections, section.id)}
                </Text>
              </View>
              <ChevronRight size={18} color={palette.textSecondary} />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

function getHymnRange(sections: HymnSection[], sectionId: number): string {
  const idx = sections.findIndex((s) => s.id === sectionId);
  if (idx === -1) return '';
  let start = 1;
  for (let i = 0; i < idx; i++) {
    start += sections[i].hymnCount;
  }
  const end = start + sections[idx].hymnCount - 1;
  return `${start}\u2013${end}`;
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
  },
  topicRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: space.screenPadding, paddingVertical: 12,
    borderBottomWidth: 1, minHeight: 56,
  },
  topicName: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  topicCap: { fontFamily: fonts.sansMedium, fontSize: 11, marginTop: 1 },
});
