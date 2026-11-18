import React, { useRef, useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Switch, Text, PanResponder, LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { Smartphone, Info, ChevronLeft, Moon, Bell, AudioLines, Cloud } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';
import { space, fonts, radius } from '@/theme/tokens';
import { useScreenClearance } from '@/utils/layout';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { SegmentedControl } from '@/components/SegmentedControl';
import { AppBar } from '@/components/AppBar';

export default function SettingsScreen() {
  const { palette } = useTheme();
  const screenClearance = useScreenClearance();
  const router = useRouter();
  const settings = useSettingsStore();

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <AppBar 
        title="Settings" 
        variant="primary" 
        onBack={() => router.back()} 
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: screenClearance }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(50).springify().damping(15)}>
          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: palette.textSecondary }]}>Appearance</Text>
            <View style={[styles.card, { backgroundColor: palette.surface }]}>
              <View style={[styles.setRow, { borderBottomColor: palette.border }]}>
                <Moon size={20} color={palette.primary} />
                <Text style={[styles.setLabel, { color: palette.text, flex: 1, marginLeft: 12 }]}>Theme</Text>
                <View style={{ width: 150 }}>
                  <SegmentedControl
                    segments={['Light', 'Dark', 'Auto']}
                    selectedIndex={settings.themeMode === 'light' ? 0 : settings.themeMode === 'dark' ? 1 : 2}
                    onSelect={(i: number) => settings.setThemeMode(i === 0 ? 'light' : i === 1 ? 'dark' : 'system')}
                  />
                </View>
              </View>
              <View style={styles.setRow}>
                <Smartphone size={20} color={palette.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.setLabel, { color: palette.text }]}>Keep screen on</Text>
                  <Text style={[styles.setDesc, { color: palette.textSecondary }]}>During services</Text>
                </View>
                <Switch
                  value={settings.keepAwake}
                  onValueChange={(v) => settings.setKeepAwake(v)}
                  trackColor={{ false: palette.border, true: palette.primary }}
                  thumbColor={palette.surface}
                />
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify().damping(15)}>
          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: palette.textSecondary }]}>Bible Text</Text>
            <View style={[styles.card, { backgroundColor: palette.surface }]}>
              <FontSlider
                value={settings.readerFontSize}
                onChange={settings.setReaderFontSize}
                palette={palette}
                min={16}
                max={28}
              />
              <Text style={[styles.fontPrev, { fontFamily: fonts.serifRegular, fontSize: settings.readerFontSize * 0.7, lineHeight: Math.round(settings.readerFontSize * 0.7 * 1.6), color: palette.text }]}>
                The Lord is my shepherd; I shall not want.
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).springify().damping(15)}>
          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: palette.textSecondary }]}>Hymn Text</Text>
            <View style={[styles.card, { backgroundColor: palette.surface }]}>
              <FontSlider
                value={settings.hymnFontSize}
                onChange={settings.setHymnFontSize}
                palette={palette}
                min={16}
                max={28}
              />
              <Text style={[styles.fontPrev, { fontFamily: fonts.sansMedium, fontSize: settings.hymnFontSize * 0.65, lineHeight: Math.round(settings.hymnFontSize * 0.65 * 1.5), color: palette.text }]}>
                All your anxiety — leave it there.
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).springify().damping(15)}>
          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: palette.textSecondary }]}>Notifications</Text>
            <View style={[styles.card, { backgroundColor: palette.surface }]}>
              <TouchableOpacity style={styles.setRow} onPress={() => router.push('/reminders')} activeOpacity={0.7}>
                <Bell size={20} color={palette.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.setLabel, { color: palette.text }]}>Reminder & Alarm Settings</Text>
                  <Text style={[styles.setDesc, { color: palette.textSecondary }]}>Devotional · Bible Reading · Prayer</Text>
                </View>
                <Text style={[styles.chevron, { color: palette.textSecondary }]}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify().damping(15)}>
          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: palette.textSecondary }]}>Coming Soon</Text>
            <View style={[styles.card, { backgroundColor: palette.surface }]}>
              <DisabledRow icon={<AudioLines size={20} color={palette.textSecondary} />} label="Audio Hymns" palette={palette} />
              <DisabledRow icon={<Cloud size={20} color={palette.textSecondary} />} label="Cloud Sync" palette={palette} />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(250).springify().damping(15)}>
          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: palette.textSecondary }]}>About</Text>
            <View style={[styles.card, { backgroundColor: palette.surface }]}>
              <TouchableOpacity style={styles.setRow} onPress={() => router.push('/about')}>
                <Info size={20} color={palette.primary} />
                <Text style={[styles.setLabel, { color: palette.text, flex: 1, marginLeft: 12 }]}>About J.H.S Bible & Hymnal</Text>
                <Text style={[styles.chevron, { color: palette.textSecondary }]}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function DisabledRow({ icon, label, palette }: any) {
  return (
    <View style={[styles.setRow, { opacity: 0.55 }]}>
      {icon}
      <Text style={[styles.setLabel, { color: palette.text, flex: 1, marginLeft: 12 }]}>{label}</Text>
      <Text style={[styles.soonBadge, { backgroundColor: palette.surfaceAlt, color: palette.highlight }]}>SOON</Text>
    </View>
  );
}

const FONT_STEPS = [16, 18, 20, 22, 24, 26, 28];
const STEP = 2;

function FontSlider({ value, onChange, palette, min, max }: any) {
  const trackRef = useRef<View>(null);
  const [trackWidth, setTrackWidth] = useState(200);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  const valueToPos = (v: number) => ((v - min) / (max - min)) * trackWidth;
  const posToValue = (px: number) => {
    const pct = Math.max(0, Math.min(1, px / trackWidth));
    const raw = min + pct * (max - min);
    const steps = Math.round((raw - min) / STEP);
    return Math.min(max, Math.max(min, min + steps * STEP));
  };

  const handleTouch = useCallback((pageX: number) => {
    trackRef.current?.measureInWindow((x, y, w) => {
      const newVal = posToValue(pageX - x);
      if (newVal !== value) onChange(newVal);
    });
  }, [value, onChange, trackWidth]);

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => handleTouch(e.nativeEvent.pageX),
    onPanResponderMove: (e) => handleTouch(e.nativeEvent.pageX),
  })).current;

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <View style={{ paddingHorizontal: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontSize: 13, color: palette.textSecondary, fontFamily: fonts.sansMedium }}>A</Text>
        <View
          ref={trackRef}
          onLayout={onLayout}
          style={{ flex: 1, height: 32, justifyContent: 'center' }}
          {...pan.panHandlers}
        >
          <View style={{ height: 4, backgroundColor: palette.border, borderRadius: 2, position: 'relative' }}>
            <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, backgroundColor: palette.primary, borderRadius: 2 }} />
            <View style={{ position: 'absolute', left: `${pct}%`, top: '50%', width: 20, height: 20, borderRadius: 10, backgroundColor: palette.primary, marginLeft: -10, marginTop: -10, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 8, color: '#fff', fontFamily: fonts.sansBold }}>{value}</Text>
            </View>
          </View>
        </View>
        <Text style={{ fontSize: 17, color: palette.textSecondary, fontFamily: fonts.sansMedium }}>A</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 2 }}>
        {FONT_STEPS.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => onChange(s)}
            style={[styles.stepDot, s === value && { backgroundColor: palette.primary }]}
          >
            <Text style={[styles.stepLabel, { color: s === value ? palette.onPrimary : palette.textSecondary }]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
  group: { marginHorizontal: space.screenPadding, marginBottom: space.space5 },
  groupTitle: {
    fontFamily: fonts.sansBold, fontSize: 10.5, letterSpacing: 0.8,
    paddingHorizontal: 4, marginBottom: 7, textTransform: 'uppercase',
  },
  card: { borderRadius: 12, overflow: 'hidden', padding: 0 },
  setRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'transparent',
  },
  setLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  setDesc: { fontFamily: fonts.sansMedium, fontSize: 10.5, marginTop: 2 },
  chevron: { fontSize: 16 },
  soonBadge: {
    fontFamily: fonts.sansBold, fontSize: 8.5,
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
    overflow: 'hidden',
  },
  fontPrev: {
    fontFamily: fonts.serifRegular,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stepDot: {
    width: 30, height: 24, borderRadius: radius.r1,
    alignItems: 'center', justifyContent: 'center',
  },
  stepLabel: { fontFamily: fonts.sansSemiBold, fontSize: 9.5 },
});
