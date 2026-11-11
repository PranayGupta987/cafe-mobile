import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/dimens';
import { Typography } from '@/constants/typography';

export type DietaryType = 'veg' | 'vegan' | 'gluten-free' | 'bestseller' | 'chef-special' | 'spicy';

interface DietaryBadgeProps {
  type: DietaryType;
  label?: string;
}

export const DietaryBadge: React.FC<DietaryBadgeProps> = ({ type, label }) => {
  const getBadgeConfig = () => {
    switch (type) {
      case 'veg':
        return {
          icon: 'leaf' as const,
          text: label || 'Pure Veg',
          bg: '#E8F8F0',
          color: '#06C167',
          borderColor: '#06C167',
        };
      case 'vegan':
        return {
          icon: 'nutrition' as const,
          text: label || 'Vegan',
          bg: '#E8F5E9',
          color: '#2E7D32',
          borderColor: '#81C784',
        };
      case 'gluten-free':
        return {
          icon: 'shield-checkmark' as const,
          text: label || 'Gluten Free',
          bg: '#FFF8E1',
          color: '#F57F17',
          borderColor: '#FFE082',
        };
      case 'bestseller':
        return {
          icon: 'flame' as const,
          text: label || 'Bestseller',
          bg: '#FFF3E0',
          color: '#E65100',
          borderColor: '#FFB74D',
        };
      case 'chef-special':
        return {
          icon: 'star' as const,
          text: label || "Chef's Special",
          bg: '#F3E5F5',
          color: '#7B1FA2',
          borderColor: '#BA68C8',
        };
      case 'spicy':
        return {
          icon: 'bonfire' as const,
          text: label || 'Spicy',
          bg: '#FFEBEE',
          color: '#C62828',
          borderColor: '#EF9A9A',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.borderColor,
        },
      ]}
    >
      <Ionicons name={config.icon} size={11} color={config.color} style={styles.icon} />
      <Text style={[Typography.labelSmall, { color: config.color, fontWeight: '700' }]}>
        {config.text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
});
