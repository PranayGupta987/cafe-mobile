import React from 'react';
import { View, StyleSheet } from 'react-native';

interface VegIndicatorProps {
  isVeg: boolean;
  size?: number;
}

export const VegIndicator: React.FC<VegIndicatorProps> = ({ isVeg, size = 16 }) => {
  const color = isVeg ? '#2E7D32' : '#D32F2F';

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderColor: color,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            width: size * 0.45,
            height: size * 0.45,
            borderRadius: (size * 0.45) / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  dot: {},
});
