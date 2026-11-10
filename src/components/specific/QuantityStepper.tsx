import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  const handleIncrement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onIncrement();
  };

  const handleDecrement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDecrement();
  };

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
        <Text style={[Typography.labelLarge, { color: Colors.cafeBrown }]}>ADD</Text>
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
        <Ionicons name="remove" size={size === 'sm' ? 14 : 18} color={Colors.cafeBrown} />
      </TouchableOpacity>

      <View style={styles.countContainer}>
        <Text style={[size === 'sm' ? Typography.labelMedium : Typography.labelLarge, styles.countText]}>
          {quantity}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleIncrement}
        style={styles.actionButton}
      >
        <Ionicons name="add" size={size === 'sm' ? 14 : 18} color={Colors.cafeBrown} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: Colors.cafeCreamLight,
    borderWidth: 1.5,
    borderColor: Colors.cafeBrown,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonMd: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  addButtonSm: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cafeBrown,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  containerMd: {
    height: 36,
  },
  containerSm: {
    height: 28,
  },
  actionButton: {
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cafeBrown,
  },
  countContainer: {
    backgroundColor: Colors.cafeBrown,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
