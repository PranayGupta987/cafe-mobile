import React, { useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Image, ImageProps } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Shimmer } from './Shimmer';
import { Radius } from '@/constants/dimens';
import { Colors } from '@/constants/colors';

interface CafeAsyncImageProps extends Omit<ImageProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
}

export const CafeAsyncImage: React.FC<CafeAsyncImageProps> = ({
  source,
  style,
  borderRadius = Radius.md,
  contentFit = 'cover',
  transition = 350,
  fallbackIcon = 'cafe-outline',
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <View style={[styles.container, { borderRadius }, style]}>
      {isLoading && !hasError ? (
        <Shimmer
          width="100%"
          height="100%"
          radius={borderRadius}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {hasError ? (
        <View style={[styles.fallbackContainer, { borderRadius }]}>
          <Ionicons name={fallbackIcon} size={28} color={Colors.uberGreen} />
        </View>
      ) : (
        <Image
          source={source}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
          contentFit={contentFit}
          transition={transition}
          cachePolicy="memory-disk"
          onLoadStart={() => {
            setIsLoading(true);
            setHasError(false);
          }}
          onLoad={() => {
            setIsLoading(false);
            setHasError(false);
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          {...props}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#F3EFEA',
  },
  fallbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#EDE8E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
