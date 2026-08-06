import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { X, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { fonts, space, radius } from '../theme/tokens';
import { useSettingsStore } from '../stores/useSettingsStore';

const FONT_SIZES = [16, 18, 20, 22, 24, 26];
const LINE_HEIGHTS = [1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2];

interface ReaderSettingsProps {
  visible: boolean;
  onClose: () => void;
  onToggleTheme: () => void;
}

export function ReaderSettings({ visible, onClose, onToggleTheme }: ReaderSettingsProps) {
  const { palette, isDark } = useTheme();
  const readerFontSize = useSettingsStore((s: any) => s.readerFontSize);
  const readerLineHeight = useSettingsStore((s: any) => s.readerLineHeight);
  const setReaderFontSize = useSettingsStore((s: any) => s.setReaderFontSize);
  const setReaderLineHeight = useSettingsStore((s: any) => s.setReaderLineHeight);
  const setReaderLetterSpacing = useSettingsStore((s: any) => s.setReaderLetterSpacing);
  const readerLetterSpacing = useSettingsStore((s: any) => s.readerLetterSpacing);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={onClose}>
        <View />
      </TouchableOpacity>
      <View style={[styles.panel, { backgroundColor: palette.surface }]}>
        <View style={[styles.handle, { backgroundColor: palette.border }]} />
        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.text }]}>Reading Preferences</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={palette.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>Font Size</Text>
          <View style={styles.chips}>
            {FONT_SIZES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.chip,
                  { borderColor: palette.border },
                  readerFontSize === s && { backgroundColor: palette.accent, borderColor: palette.accent },
                ]}
                onPress={() => setReaderFontSize(s)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: palette.textSecondary, fontSize: s * 0.5 + 4 },
                    readerFontSize === s && { color: palette.onAccent },
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>Line Spacing</Text>
          <View style={styles.chips}>
            {LINE_HEIGHTS.map((lh) => (
              <TouchableOpacity
                key={lh}
                style={[
                  styles.chip,
                  { borderColor: palette.border },
                  Math.abs(readerLineHeight - lh) < 0.01 && { backgroundColor: palette.accent, borderColor: palette.accent },
                ]}
                onPress={() => setReaderLineHeight(lh)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: palette.textSecondary, fontSize: 13 },
                    Math.abs(readerLineHeight - lh) < 0.01 && { color: palette.onAccent },
                  ]}
                >
                  {lh.toFixed(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>Theme</Text>
          <View style={styles.themeRow}>
            <TouchableOpacity
              style={[
                styles.themeBtn,
                { borderColor: palette.border },
                !isDark && { backgroundColor: palette.accent, borderColor: palette.accent },
              ]}
              onPress={isDark ? onToggleTheme : undefined}
            >
              <Sun size={18} color={!isDark ? palette.onAccent : palette.textSecondary} />
              <Text style={[styles.themeLabel, { color: !isDark ? palette.onAccent : palette.textSecondary }]}>
                Day
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeBtn,
                { borderColor: palette.border },
                isDark && { backgroundColor: palette.accent, borderColor: palette.accent },
              ]}
              onPress={!isDark ? onToggleTheme : undefined}
            >
              <Moon size={18} color={isDark ? palette.onAccent : palette.textSecondary} />
              <Text style={[styles.themeLabel, { color: isDark ? palette.onAccent : palette.textSecondary }]}>
                Night
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.preview, { backgroundColor: palette.background, borderColor: palette.border }]}>
          <Text
            style={[
              styles.previewText,
              {
                fontFamily: fonts.serifRegular,
                fontSize: readerFontSize * 0.55,
                lineHeight: Math.round(readerFontSize * 0.55 * readerLineHeight),
                letterSpacing: readerLetterSpacing,
                color: palette.text,
              },
            ]}
          >
            <Text style={[styles.previewVn, { color: palette.textSecondary, fontSize: 10 }]}>1 </Text>
            In the beginning God created the heaven and the earth.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  panel: {
    borderTopLeftRadius: radius.r3,
    borderTopRightRadius: radius.r3,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 8, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: space.screenPadding, paddingVertical: space.space3,
  },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 18 },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: space.screenPadding, marginBottom: space.space5 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.5, marginBottom: space.space2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5, borderRadius: radius.r2,
    paddingHorizontal: 14, paddingVertical: 8,
    minWidth: 44, alignItems: 'center',
  },
  chipText: { fontFamily: fonts.sansSemiBold },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1.5, borderRadius: radius.r2,
    paddingHorizontal: 16, paddingVertical: 10,
    flex: 1, justifyContent: 'center',
  },
  themeLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  preview: {
    marginHorizontal: space.screenPadding,
    marginTop: space.space1,
    padding: space.space4,
    borderRadius: radius.r2,
    borderWidth: 1,
  },
  previewText: { textAlign: 'justify' },
  previewVn: { fontFamily: fonts.sansSemiBold },
});
