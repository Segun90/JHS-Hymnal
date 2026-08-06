import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { fonts, space } from '../theme/tokens';

interface HymnListItemProps {
  number: number;
  title: string;
  firstLine?: string | null;
  author?: string;
  isFavorited?: boolean;
  onPress: () => void;
  onFavoriteToggle?: () => void;
}

export function HymnListItem({ number, title, firstLine, author, isFavorited, onPress, onFavoriteToggle }: HymnListItemProps) {
  const { palette } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: palette.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.badge, { borderColor: palette.primary }]}>
        <Text style={[styles.badgeText, { color: palette.primary }]}>{number}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        {firstLine ? (
          <Text style={[styles.firstLine, { color: palette.textSecondary }]} numberOfLines={1}>
            {firstLine}
          </Text>
        ) : null}
      </View>
      {onFavoriteToggle && (
        <TouchableOpacity onPress={onFavoriteToggle} style={styles.favBtn}>
          <Heart size={18} color={isFavorited ? palette.primary : palette.textSecondary} fill={isFavorited ? palette.primary : 'transparent'} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingHorizontal: space.screenPadding, paddingVertical: 11,
    borderBottomWidth: 1, minHeight: 60,
  },
  badge: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 12 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  firstLine: { fontFamily: fonts.sansMedium, fontSize: 11, marginTop: 1 },
  favBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
