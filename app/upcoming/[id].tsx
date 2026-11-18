import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Clock, CheckCircle, Calendar, BookOpen } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { space, fonts, radius, gradients } from '@/theme/tokens';
import { getUpcomingContent } from '@/data/upcomingContent';
import { AppBar } from '@/components/AppBar';
import type { ContentStatus } from '@/data/upcomingContent';

const STATUS_CONFIG: Record<ContentStatus, { label: string; color: string; icon: typeof Clock }> = {
  upcoming: { label: 'COMING SOON', color: '#D4A017', icon: Clock },
  available: { label: 'AVAILABLE NOW', color: '#2E7D32', icon: CheckCircle },
  completed: { label: 'COMPLETED', color: '#6B7280', icon: CheckCircle },
};

function formatDateRange(start?: string, end?: string): string {
  if (!start) return '';
  const s = new Date(start);
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
  const startStr = s.toLocaleDateString('en-US', opts);
  if (!end) return startStr;
  const e = new Date(end);
  const endStr = e.toLocaleDateString('en-US', opts);
  const year = s.toLocaleDateString('en-US', { year: 'numeric' });
  return `${startStr} \u2013 ${endStr}, ${year}`;
}

export default function UpcomingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette } = useTheme();

  const items = getUpcomingContent();
  const item = items.find((i) => i.id === id);

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[styles.errorText, { color: palette.textSecondary }]}>Content not found.</Text>
      </View>
    );
  }

  const statusInfo = STATUS_CONFIG[item.status];
  const StatusIcon = statusInfo.icon;

  const dateStr = item.startDate
    ? formatDateRange(item.startDate, item.endDate)
    : new Date(item.releaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <AppBar 
        title={item.title} 
        variant="primary" 
        onBack={() => router.back()} 
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={item.status === 'upcoming' ? gradients.hero : gradients.secondary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            {item.category === 'fasting_program' ? (
              <Calendar size={48} color="rgba(255,255,255,0.9)" />
            ) : (
              <BookOpen size={48} color="rgba(255,255,255,0.9)" />
            )}
          </View>

          <View style={styles.heroContent}>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <StatusIcon size={14} color="#FFFFFF" />
              <Text style={styles.statusBadgeText}>{statusInfo.label}</Text>
            </View>

            <Text style={styles.heroTitle}>{item.title}</Text>

            {item.subtitle && (
              <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
            )}

            <Text style={styles.heroDate}>{dateStr}</Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={[styles.description, { color: palette.text }]}>{item.description}</Text>

          {item.status === 'upcoming' && (
            <View style={[styles.comingSoonCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Clock size={20} color={statusInfo.color} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.comingSoonTitle, { color: statusInfo.color }]}>Coming Soon</Text>
                <Text style={[styles.comingSoonBody, { color: palette.textSecondary }]}>
                  This program will become available when the scheduled release date arrives.
                </Text>
              </View>
            </View>
          )}

          {item.status === 'available' && (
            <View style={[styles.comingSoonCard, { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }]}>
              <CheckCircle size={20} color="#2E7D32" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.comingSoonTitle, { color: '#2E7D32' }]}>Available Now</Text>
                <Text style={[styles.comingSoonBody, { color: palette.textSecondary }]}>
                  This content is ready to explore.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space.screenPadding, paddingTop: 56, paddingBottom: 10,
    borderBottomWidth: 1,
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  appbarTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, flex: 1 },
  scroll: { paddingBottom: 40 },
  hero: {
    paddingTop: 40, paddingBottom: 32, paddingHorizontal: space.screenPadding,
    alignItems: 'center',
  },
  heroIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  heroContent: { alignItems: 'center' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.rFull, marginBottom: 12,
  },
  statusBadgeText: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontFamily: fonts.sansBold, fontSize: 24, color: '#FFFFFF',
    textAlign: 'center', lineHeight: 30, marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: fonts.sansMedium, fontSize: 14, color: 'rgba(255,255,255,0.8)',
    textAlign: 'center', marginBottom: 8,
  },
  heroDate: {
    fontFamily: fonts.sansMedium, fontSize: 13, color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  body: { padding: space.screenPadding },
  description: {
    fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 24,
    marginBottom: 24,
  },
  comingSoonCard: {
    flexDirection: 'row', gap: 12, padding: 16,
    borderRadius: radius.r2, borderWidth: 1,
    alignItems: 'flex-start',
  },
  comingSoonTitle: {
    fontFamily: fonts.sansSemiBold, fontSize: 14, marginBottom: 4,
  },
  comingSoonBody: {
    fontFamily: fonts.sansMedium, fontSize: 13, lineHeight: 18,
  },
  errorText: {
    fontFamily: fonts.sansMedium, fontSize: 15,
  },
});
