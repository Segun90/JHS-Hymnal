import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { fonts, space, radius } from '../theme/tokens';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search Bible & hymns\u2026', autoFocus }: SearchBarProps) {
  const { palette } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
      <View style={[styles.bar, { backgroundColor: palette.surfaceAlt }]}>
        <Search size={16} color={palette.textSecondary} />
        <TextInput
          style={[styles.input, { color: palette.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.textSecondary}
          autoFocus={autoFocus}
          accessibilityLabel="Search"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} accessibilityLabel="Clear search">
            <X size={16} color={palette.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1 },
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: space.space2,
    borderRadius: radius.rFull, paddingHorizontal: space.space4,
    minHeight: 44,
  },
  input: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 13.5 },
});
