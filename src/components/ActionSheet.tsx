import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fonts, space, radius, elevation, gradients } from '../theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

interface ActionSheetProps {
  visible: boolean;
  title: string;
  subtitle: string;
  actions: { icon: React.ReactNode; label: string; onPress: () => void; destructive?: boolean }[];
  onCancel: () => void;
}

export function ActionSheet({ visible, title, subtitle, actions, onCancel }: ActionSheetProps) {
  const { palette, isDark } = useTheme();
  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableOpacity
        style={[styles.scrim, { backgroundColor: palette.scrim }]}
        onPress={onCancel}
        activeOpacity={1}
      />
      <View style={[styles.sheet, { backgroundColor: palette.surface }, elevation.modal]}>
        <LinearGradient 
          colors={isDark ? gradients.surfaceSoftDark : gradients.surfaceSoftLight} 
          style={StyleSheet.absoluteFill} 
          start={{x: 0, y: 0}} end={{x: 0, y: 1}} 
          pointerEvents="none"
        />
        <View style={[styles.head, { borderBottomColor: palette.border }]}>
          <Text style={[styles.headTitle, { color: palette.text }]}>{title}</Text>
          <Text style={[styles.headSub, { color: palette.textSecondary }]}>{subtitle}</Text>
        </View>
        <ScrollView bounces={false}>
          {actions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.row}
              onPress={action.onPress}
              accessibilityLabel={action.label}
            >
              <View style={styles.iconWrap}>
                {action.icon}
              </View>
              <Text style={[styles.rowLabel, { color: action.destructive ? palette.error : palette.text }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={onCancel} style={[styles.cancel, { borderTopColor: palette.border }]}>
          <Text style={[styles.cancelLabel, { color: palette.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1 },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: space.space5, maxHeight: '70%',
  },
  head: { paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1 },
  headTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  headSub: { fontFamily: fonts.serifRegular, fontStyle: 'italic', fontSize: 11.5, marginTop: 3 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    paddingHorizontal: 18, minHeight: 50,
  },
  iconWrap: { width: 24, alignItems: 'center' },
  rowLabel: { fontFamily: fonts.sansMedium, fontSize: 13.5 },
  cancel: {
    marginHorizontal: 14, marginTop: 8,
    paddingTop: 11, borderTopWidth: 1,
    alignItems: 'center',
  },
  cancelLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
});
