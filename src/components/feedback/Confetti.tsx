import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPieceProps {
  color: string;
  startX: number;
  delay: number;
  onFinish?: () => void;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ color, startX, delay, onFinish }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withSequence(
        withSpring(SCREEN_HEIGHT * 0.4, { damping: 12 }),
        withTiming(SCREEN_HEIGHT + 50, { duration: 800 }, (finished?: boolean) => {
          if (finished && onFinish) {
            runOnJS(onFinish)();
          }
        })
      )
    );
    translateX.value = withDelay(
      delay,
      withSpring(startX + (Math.random() * 100 - 50), { damping: 8 })
    );
    rotation.value = withDelay(
      delay,
      withTiming(Math.random() * 720 - 360, { duration: 1200 })
    );
    opacity.value = withDelay(
      delay + 600,
      withTiming(0, { duration: 400 })
    );
  }, [delay, startX, onFinish, opacity, rotation, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
};

interface ConfettiHostProps {
  visible: boolean;
  onComplete?: () => void;
}

export const ConfettiHost: React.FC<ConfettiHostProps> = ({ visible, onComplete }) => {
  if (!visible) return null;

  const colors = [Colors.cafeBrown, Colors.cafeGold, Colors.success, '#FFB703', '#FB8500', '#8ECAE6'];
  const piecesCount = 30;
  const pieces = Array.from({ length: piecesCount }).map((_, index) => ({
    id: index,
    color: colors[index % colors.length],
    startX: SCREEN_WIDTH / 2 + (Math.random() * 200 - 100),
    delay: Math.random() * 200,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p) => (
        <ConfettiPiece
          key={p.id}
          color={p.color}
          startX={p.startX}
          delay={p.delay}
          onFinish={p.id === piecesCount - 1 ? onComplete : undefined}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    width: 10,
    height: 14,
    borderRadius: 3,
  },
});
