import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { space } from '../theme/tokens';
import { usePathname, useRouter } from 'expo-router';
import { Home, BookOpen, Music, Search, Library } from 'lucide-react-native';

const tabs = [
  { name: 'Home', icon: Home, route: '/(tabs)' },
  { name: 'Bible', icon: BookOpen, route: '/(tabs)/bible' },
  { name: 'Hymns', icon: Music, route: '/(tabs)/hymns' },
  { name: 'Search', icon: Search, route: '/(tabs)/search' },
  { name: 'Library', icon: Library, route: '/(tabs)/library' },
];

export function BottomTabBar() {
  const { palette } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (route: string) => {
    if (route === '/(tabs)') return pathname === '/(tabs)' || pathname === '/';
    return pathname.startsWith(route);
  };

  return (
    <View style={[styles.bar, { backgroundColor: palette.surface, borderTopColor: palette.border }]}>
      {tabs.map((tab) => {
        const active = isActive(tab.route);
        const Icon = tab.icon;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => router.replace(tab.route as any)}
            accessibilityLabel={tab.name}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Icon size={22} color={active ? palette.accent : palette.textSecondary} />
            <Text style={[styles.label, { color: active ? palette.accent : palette.textSecondary }]}>
              {tab.name}
            </Text>
            <View style={[styles.pill, { backgroundColor: active ? palette.accent : 'transparent' }]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', borderTopWidth: 1,
    paddingHorizontal: space.space1, paddingTop: space.space2, paddingBottom: 12,
  },
  tab: {
    flex: 1, alignItems: 'center', gap: 2, paddingTop: space.space1,
  },
  label: { fontSize: 9.5, fontWeight: '600' },
  pill: { width: 16, height: 3, borderRadius: 2, marginTop: 2 },
});
