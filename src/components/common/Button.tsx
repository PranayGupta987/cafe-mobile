import React from 'react';
import {
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, TouchTarget } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { SpringConfigs } from '@/constants/motion';
import { hapticFeedback } from '@/utils/haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'black';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface CafeButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

export const CafeButton: React.FC<CafeButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  haptic = true,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, SpringConfigs.snappy);
      if (haptic) hapticFeedback.tap();
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfigs.bouncy);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.md,
      opacity: disabled ? 0.5 : 1,
      minHeight: size === 'sm' ? 36 : TouchTarget.min,
    };

    switch (size) {
      case 'sm':
        base = { ...base, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md };
        break;
      case 'lg':
        base = { ...base, paddingVertical: Spacing.base, paddingHorizontal: Spacing.xl, minHeight: 54 };
        break;
      case 'md':
      default:
        base = { ...base, paddingVertical: Spacing.md, paddingHorizontal: Spacing.base };
        break;
    }

    switch (variant) {
      case 'secondary':
        return { ...base, backgroundColor: Colors.uberGreenContainer };
      case 'black':
        return { ...base, backgroundColor: Colors.uberBlack };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: Colors.uberGreen,
        };
      case 'danger':
        return { ...base, backgroundColor: Colors.error };
      case 'ghost':
        return { ...base, backgroundColor: 'transparent' };
      case 'primary':
      default:
        return { ...base, backgroundColor: Colors.uberGreen };
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      ...Typography.labelLarge,
      fontWeight: '700',
    };

    switch (variant) {
      case 'secondary':
        return { ...base, color: Colors.uberGreenDark };
      case 'outline':
        return { ...base, color: Colors.uberGreen };
      case 'danger':
      case 'black':
        return { ...base, color: '#FFFFFF' };
      case 'ghost':
        return { ...base, color: Colors.uberGreen };
      case 'primary':
      default:
        return { ...base, color: '#FFFFFF' };
    }
  };

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      <Animated.View style={[getContainerStyle(), animatedStyle, style]}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'danger' || variant === 'black' ? '#FFFFFF' : Colors.uberGreen}
          />
        ) : (
          <>
            {icon ? <>{icon}</> : null}
            <Text style={[getTextStyle(), icon ? { marginLeft: Spacing.sm } : undefined, textStyle]}>
              {title}
            </Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
};
