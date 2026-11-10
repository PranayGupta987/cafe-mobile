import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/dimens';
import { Typography } from '@/constants/typography';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getColors = () => {
    switch (status.toUpperCase()) {
      case 'PLACED':
        return { bg: Colors.infoContainer, text: Colors.info };
      case 'ACCEPTED':
        return { bg: Colors.cafeGoldContainer, text: Colors.cafeGoldDark };
      case 'PREPARING':
        return { bg: Colors.warningContainer, text: Colors.warning };
      case 'READY':
        return { bg: Colors.successContainer, text: Colors.success };
      case 'SERVED':
      case 'COMPLETED':
        return { bg: Colors.cafeBrownContainer, text: Colors.cafeBrownDark };
      case 'CANCELLED':
        return { bg: Colors.errorContainer, text: Colors.error };
      default:
        return { bg: '#F5F5F5', text: '#616161' };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[Typography.labelSmall, { color: text }]}>{status.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
});
