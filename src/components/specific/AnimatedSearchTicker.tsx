import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/dimens';

interface AnimatedSearchTickerProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholders?: string[];
  onSubmit?: () => void;
  intervalMs?: number;
}

const DEFAULT_PLACEHOLDERS = [
  'Search "Iced Matcha Latte"',
  'Search "Avocado Toast"',
  'Search "Cold Brew Float"',
  'Search "Sourdough Croissant"',
  'Search "Tiramisu Cheesecake"',
];

export const AnimatedSearchTicker: React.FC<AnimatedSearchTickerProps> = ({
  value,
  onChangeText,
  placeholders = DEFAULT_PLACEHOLDERS,
  onSubmit,
  intervalMs = 2600,
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (value.length > 0) return; // Freeze rotation when user types
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % placeholders.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [value, placeholders.length, intervalMs]);

  return (
    <View style={styles.searchBar}>
      <Ionicons name="search" size={20} color={Colors.uberGreen} />

      <View style={styles.inputContainer}>
        {value.length === 0 && (
          <View pointerEvents="none" style={styles.placeholderWrapper}>
            <Animated.Text
              key={index}
              entering={FadeInDown.duration(280)}
              exiting={FadeOutUp.duration(240)}
              layout={LinearTransition}
              style={styles.animatedPlaceholder}
              numberOfLines={1}
            >
              {placeholders[index]}
            </Animated.Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          placeholderTextColor="transparent"
        />
      </View>

      {value.length > 0 ? (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      ) : (
        <View style={styles.micIcon}>
          <Ionicons name="mic-outline" size={18} color={Colors.textMuted} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    height: 46,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
    position: 'relative',
  },
  placeholderWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  animatedPlaceholder: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
    paddingVertical: 0,
  },
  micIcon: {
    paddingLeft: 4,
  },
});
