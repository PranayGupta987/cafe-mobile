import React from 'react';
import { ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Elevation } from '@/constants/dimens';
import { SpringConfigs } from '@/constants/motion';
import { hapticFeedback } from '@/utils/haptics';

interface CafeCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'flat' | 'warm';
  onPress?: () => void;
  activeOpacity?: number;
}

export const CafeCard: React.FC<CafeCardProps> = ({
  children,
  style,
  variant = 'elevated',
  onPress,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, SpringConfigs.snappy);
      hapticFeedback.tap();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, SpringConfigs.bouncy);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getStyle = (): ViewStyle => {
    const base: ViewStyle = {
      backgroundColor: Colors.surface,
      borderRadius: Radius.card,
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
          backgroundColor: Colors.surfaceVariant,
        };
      case 'warm':
        return {
          ...base,
          backgroundColor: Colors.surface,
          ...Elevation.warmSm,
          borderWidth: 1,
          borderColor: 'rgba(6, 193, 103, 0.12)',
        };
      case 'elevated':
      default:
        return {
          ...base,
          ...Elevation.sm,
          borderWidth: 1,
          borderColor: Colors.border,
        };
    }
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[getStyle(), animatedStyle, style]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return <Animated.View style={[getStyle(), style]}>{children}</Animated.View>;
};
