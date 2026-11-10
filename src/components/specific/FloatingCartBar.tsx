import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
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
    <Animated.View
      entering={FadeInDown.springify().damping(15)}
      exiting={FadeOutDown.duration(200)}
      style={styles.wrapper}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        style={styles.container}
      >
        <LinearGradient
          colors={['#2E1C14', '#1A0F0A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
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
          <View style={styles.arrowIconWrap}>
            <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 74,
    left: Spacing.base,
    right: Spacing.base,
    zIndex: 999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.full,
    paddingVertical: 14,
    paddingHorizontal: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(221, 161, 94, 0.3)',
    ...Elevation.lg,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: Colors.caramel,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  badgeText: {
    color: '#1A0F0A',
    fontSize: 13,
    fontWeight: '800',
  },
  priceContainer: {},
  priceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewCartText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  arrowIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
