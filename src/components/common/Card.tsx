import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Elevation } from '@/constants/dimens';

interface CafeCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export const CafeCard: React.FC<CafeCardProps> = ({
  children,
  style,
  variant = 'elevated',
}) => {
  const getStyle = (): ViewStyle => {
    const base: ViewStyle = {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.base,
    };

    switch (variant) {
      case 'outlined':
        return {
          ...base,
          borderWidth: 1,
          borderColor: Colors.border,
        };
      case 'flat':
        return {
          ...base,
          backgroundColor: Colors.cafeCreamLight,
        };
      case 'elevated':
      default:
        return {
          ...base,
          ...Elevation.sm,
          borderWidth: 1,
          borderColor: '#F3ECE7',
        };
    }
  };

  return <View style={[getStyle(), style]}>{children}</View>;
};
