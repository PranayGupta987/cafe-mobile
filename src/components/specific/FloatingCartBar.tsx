import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Elevation } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { formatPaise } from '@/utils/currency';

interface FloatingCartBarProps {
  totalItems: number;
  totalPaise: number;
  onPress: () => void;
  tableNumber?: number | null;
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({
  totalItems,
  totalPaise,
  onPress,
  tableNumber,
}) => {
  if (totalItems <= 0) return null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={styles.container}
      >
        <View style={styles.leftSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalItems}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>{formatPaise(totalPaise)}</Text>
            <Text style={styles.subtext}>
              {tableNumber ? `Table ${tableNumber} • Taxes extra` : 'Plus taxes'}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.viewCartText}>View Cart</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Spacing.base,
    left: Spacing.base,
    right: Spacing.base,
    zIndex: 999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cafeBrown,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    ...Elevation.md,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#FFFFFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  badgeText: {
    color: Colors.cafeBrown,
    fontSize: 12,
    fontWeight: '700',
  },
  priceContainer: {},
  priceText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  subtext: {
    color: Colors.cafeBrownContainer,
    fontSize: 11,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCartText: {
    color: '#FFFFFF',
    ...Typography.labelLarge,
  },
});
