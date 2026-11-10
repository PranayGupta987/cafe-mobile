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

const COLORS = [Colors.cafeBrown, Colors.cafeGold, Colors.success, '#FFB703', '#FB8500', '#8ECAE6'];
const PIECES_COUNT = 30;
const STATIC_PIECES = Array.from({ length: PIECES_COUNT }).map((_, index) => ({
  id: index,
  color: COLORS[index % COLORS.length],
  startX: SCREEN_WIDTH / 2 + (((index * 37) % 200) - 100),
  delay: (index * 17) % 200,
}));

export const ConfettiHost: React.FC<ConfettiHostProps> = ({ visible, onComplete }) => {
  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {STATIC_PIECES.map((p) => (
        <ConfettiPiece
          key={p.id}
          color={p.color}
          startX={p.startX}
          delay={p.delay}
          onFinish={p.id === PIECES_COUNT - 1 ? onComplete : undefined}
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
