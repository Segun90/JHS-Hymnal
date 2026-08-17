import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, BookOpen, Calendar, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { space, fonts, radius, elevation, gradients } from '@/theme/tokens';
import type { UpcomingContent } from '@/data/upcomingContent';

interface Props {
  item: UpcomingContent;
  onPress: () => void;
}

const STATUS_CONFIG = {
  upcoming: { label: 'UPCOMING', color: '#D4A017', icon: Clock },
  available: { label: 'AVAILABLE', color: '#2E7D32', icon: CheckCircle },
  completed: { label: 'COMPLETED', color: '#6B7280', icon: CheckCircle },
} as const;

const CATEGORY_ICON: Record<string, typeof BookOpen> = {
  fasting_program: Calendar,
  book: BookOpen,
  devotional: BookOpen,
  sermon: BookOpen,
  bible_study: BookOpen,
  church_program: Calendar,
  publication: BookOpen,
};

function formatDateRange(start?: string, end?: string): string {
  if (!start) return '';
  const s = new Date(start);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = s.toLocaleDateString('en-US', opts);
  if (!end) return startStr;
  const e = new Date(end);
  const endStr = e.toLocaleDateString('en-US', opts);
  const year = s.toLocaleDateString('en-US', { year: 'numeric' });
  return `${startStr} \u2013 ${endStr}, ${year}`;
}

export function UpcomingCard({ item, onPress }: Props) {
  const { palette } = useTheme();
  const statusInfo = STATUS_CONFIG[item.status];
  const StatusIcon = statusInfo.icon;
  const CategoryIcon = CATEGORY_ICON[item.category] ?? BookOpen;

  const dateStr = item.startDate
    ? formatDateRange(item.startDate, item.endDate)
    : new Date(item.releaseDate).toLocaleDateString('en-US', { year: 'numeric' });

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: palette.surface }, elevation.card]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageArea}>
        <LinearGradient
          colors={item.status === 'upcoming' ? gradients.hero : gradients.secondary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <CategoryIcon size={32} color="rgba(255,255,255,0.9)" />
        </LinearGradient>
      </View>

      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: statusInfo.color + '18' }]}>
          <StatusIcon size={10} color={statusInfo.color} />
          <Text style={[styles.badgeText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>

        <Text style={[styles.title, { color: palette.text }]} numberOfLines={2}>
          {item.title}
        </Text>

        {item.subtitle && (
          <Text style={[styles.subtitle, { color: palette.textSecondary }]} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}

        <Text style={[styles.date, { color: palette.textSecondary }]} numberOfLines={1}>
          {dateStr}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.r2,
    overflow: 'hidden',
    flex: 1,
    maxWidth: '48%',
  },
  imageArea: {
    height: 100,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.rFull,
    marginBottom: 8,
  },
  badgeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 2,
  },
  date: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    lineHeight: 14,
  },
});
