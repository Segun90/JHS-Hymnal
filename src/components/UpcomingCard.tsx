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

  // Determine specific visuals based on category or ID
  let VisualComponent = <CategoryIcon size={40} color="rgba(255,255,255,0.9)" />;
  let BgIcon = <CategoryIcon size={120} color="rgba(255,255,255,0.15)" />;

  if (item.category === 'fasting_program') {
    VisualComponent = <Text style={styles.emojiArt}>🛐</Text>;
    BgIcon = <Text style={styles.bgEmojiArt}>🛐</Text>;
  } else if (item.category === 'book') {
    VisualComponent = <Text style={styles.emojiArt}>📚</Text>;
    BgIcon = <Text style={styles.bgEmojiArt}>📚</Text>;
  }

  // Adjust gradient colors to be more rich and elegant
  const cardGradient = item.status === 'upcoming' 
    ? ['#1a2a6c', '#b21f1f', '#fdbb2d'] 
    : ['#11998e', '#38ef7d'];

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: palette.surface }, elevation.card]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageArea}>
        <LinearGradient
          colors={item.status === 'upcoming' ? ['#1E3A8A', '#2747A8'] : ['#C62828', '#B71C1C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.bgIconContainer}>
            {BgIcon}
          </View>
          <View style={styles.visualContainer}>
            {VisualComponent}
          </View>
        </LinearGradient>
      </View>

      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: statusInfo.color + '15' }]}>
          <StatusIcon size={12} color={statusInfo.color} />
          <Text style={[styles.badgeText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>

        <Text style={[styles.title, { color: palette.text }]} numberOfLines={2}>
          {item.title}
        </Text>

        {item.subtitle && (
          <Text style={[styles.subtitle, { color: palette.primary }]} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}

        <View style={styles.footer}>
          <Text style={[styles.date, { color: palette.textSecondary }]} numberOfLines={1}>
            {dateStr}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.r3,
    overflow: 'hidden',
    flex: 1,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  imageArea: {
    height: 120,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bgIconContainer: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.6,
  },
  visualContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  emojiArt: {
    fontSize: 32,
    textAlign: 'center',
  },
  bgEmojiArt: {
    fontSize: 100,
    opacity: 0.15,
  },
  content: {
    padding: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.rFull,
    marginBottom: 10,
  },
  badgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  footer: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
  },
});
