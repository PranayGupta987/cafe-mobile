import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/dimens';
import { Typography } from '@/constants/typography';

interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'sm' | 'md';
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  quantity,
  onIncrement,
  onDecrement,
  size = 'md',
}) => {
  const countScale = useSharedValue(1);

  const triggerBounce = () => {
    countScale.value = withSequence(
      withSpring(1.25, { damping: 4, stiffness: 200 }),
      withSpring(1, { damping: 6 })
    );
  };

  const handleIncrement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    triggerBounce();
    onIncrement();
  };

  const handleDecrement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    triggerBounce();
    onDecrement();
  };

  const countAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countScale.value }],
  }));

  if (quantity === 0) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleIncrement}
        style={[
          styles.addButton,
          size === 'sm' ? styles.addButtonSm : styles.addButtonMd,
        ]}
      >
        <Text style={[Typography.labelLarge, { color: Colors.uberGreen, fontWeight: '800' }]}>
          ADD
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, size === 'sm' ? styles.containerSm : styles.containerMd]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleDecrement}
        style={styles.actionButton}
      >
        <Ionicons name="remove" size={size === 'sm' ? 14 : 18} color="#FFFFFF" />
      </TouchableOpacity>

      <Animated.View style={[styles.countContainer, countAnimatedStyle]}>
        <Text style={[size === 'sm' ? Typography.labelMedium : Typography.labelLarge, styles.countText]}>
          {quantity}
        </Text>
      </Animated.View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleIncrement}
        style={styles.actionButton}
      >
        <Ionicons name="add" size={size === 'sm' ? 14 : 18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.uberGreen,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    shadowColor: Colors.uberGreen,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonMd: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  addButtonSm: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.uberGreen,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    shadowColor: Colors.uberGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  containerMd: {
    height: 38,
  },
  containerSm: {
    height: 30,
  },
  actionButton: {
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.uberGreen,
    minWidth: 32,
    minHeight: 36,
  },
  countContainer: {
    backgroundColor: Colors.uberGreen,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 26,
  },
  countText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
