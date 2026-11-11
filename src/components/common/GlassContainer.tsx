import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Elevation } from '@/constants/dimens';

interface GlassContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'light' | 'dark' | 'subtle';
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  style,
  variant = 'light',
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'dark':
        return 'rgba(20, 18, 16, 0.88)';
      case 'subtle':
        return 'rgba(255, 255, 255, 0.75)';
      case 'light':
      default:
        return Colors.glassBackground;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'dark' ? 'rgba(255,255,255,0.1)' : Colors.glassBorder,
        },
        Elevation.warmSm,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
