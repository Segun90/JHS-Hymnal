import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius, space, type, elevation } from '../theme/tokens';

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchField({ value, onChangeText, placeholder = 'Search books...' }: SearchFieldProps) {
  const { palette } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: palette.surface, shadowColor: elevation.card.shadowColor }]}>
      <Search size={20} color={palette.textSecondary} style={styles.icon} />
      <TextInput
        style={[styles.input, type.body, { color: palette.text }]}
        placeholder={placeholder}
        placeholderTextColor={palette.textSecondary}
        value={value}
        onChangeText={onChangeText}
        selectionColor={palette.primary}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          style={styles.clearBtn}
          accessibilityLabel="Clear search"
        >
          <X size={18} color={palette.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: radius.rFull,
    paddingHorizontal: space.space4,
    marginHorizontal: space.screenPadding,
    marginVertical: space.space3,
    // Soft shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  icon: {
    marginRight: space.space2,
  },
  input: {
    flex: 1,
    height: '100%',
  },
  clearBtn: {
    padding: space.space2,
  },
});
