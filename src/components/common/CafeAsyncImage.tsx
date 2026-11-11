import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image, ImageProps } from 'expo-image';
import { Shimmer } from './Shimmer';
import { Radius } from '@/constants/dimens';

interface CafeAsyncImageProps extends Omit<ImageProps, 'style'> {
  style?: ViewStyle;
  borderRadius?: number;
}

export const CafeAsyncImage: React.FC<CafeAsyncImageProps> = ({
  source,
  style,
  borderRadius = Radius.md,
  contentFit = 'cover',
  transition = 350,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View style={[styles.container, { borderRadius }, style]}>
      {isLoading ? (
        <Shimmer
          width="100%"
          height={typeof style?.height === 'number' ? style.height : 120}
          radius={borderRadius}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <Image
        source={source}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
        contentFit={contentFit}
        transition={transition}
        onLoadStart={() => setIsLoading(true)}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#F0ECE9',
  },
});
