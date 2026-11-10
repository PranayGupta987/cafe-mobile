import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/dimens';
import { Typography } from '@/constants/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
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
  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.md,
      opacity: disabled ? 0.5 : 1,
    };

    switch (size) {
      case 'sm':
        base = { ...base, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md };
        break;
      case 'lg':
        base = { ...base, paddingVertical: Spacing.base, paddingHorizontal: Spacing.xl };
        break;
      case 'md':
      default:
        base = { ...base, paddingVertical: Spacing.md, paddingHorizontal: Spacing.base };
        break;
    }

    switch (variant) {
      case 'secondary':
        return { ...base, backgroundColor: Colors.cafeBrownContainer };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: Colors.cafeBrown,
        };
      case 'danger':
        return { ...base, backgroundColor: Colors.error };
      case 'ghost':
        return { ...base, backgroundColor: 'transparent' };
      case 'primary':
      default:
        return { ...base, backgroundColor: Colors.cafeBrown };
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      ...Typography.labelLarge,
    };

    switch (variant) {
      case 'secondary':
        return { ...base, color: Colors.cafeBrownDark };
      case 'outline':
        return { ...base, color: Colors.cafeBrown };
      case 'danger':
        return { ...base, color: '#FFFFFF' };
      case 'ghost':
        return { ...base, color: Colors.cafeBrown };
      case 'primary':
      default:
        return { ...base, color: '#FFFFFF' };
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : Colors.cafeBrown}
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text style={[getTextStyle(), icon ? { marginLeft: Spacing.sm } : undefined, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};
