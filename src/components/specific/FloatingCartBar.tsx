import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Elevation } from '@/constants/dimens';
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
  const badgeScale = useSharedValue(1);

  useEffect(() => {
    if (totalItems > 0) {
      badgeScale.value = withSequence(
        withSpring(1.3, { damping: 4, stiffness: 220 }),
        withSpring(1, { damping: 7 })
      );
    }
  }, [totalItems]);

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

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
          colors={['#000000', '#1A1A1A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.leftSection}>
          <Animated.View style={[styles.badge, animatedBadgeStyle]}>
            <Text style={styles.badgeText}>{totalItems}</Text>
          </Animated.View>
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
            <Ionicons name="arrow-forward" size={15} color="#000000" />
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
    borderWidth: 1.5,
    borderColor: 'rgba(6, 193, 103, 0.4)',
    shadowColor: Colors.uberGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: Colors.uberGreen,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    shadowColor: Colors.uberGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
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
    backgroundColor: Colors.uberGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
