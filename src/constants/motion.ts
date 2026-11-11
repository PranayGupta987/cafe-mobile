import { WithSpringConfig } from 'react-native-reanimated';

export const SpringConfigs = {
  bouncy: {
    damping: 12,
    stiffness: 140,
    mass: 1,
  } as WithSpringConfig,

  snappy: {
    damping: 15,
    stiffness: 220,
    mass: 0.8,
  } as WithSpringConfig,

  gentle: {
    damping: 20,
    stiffness: 90,
    mass: 1,
  } as WithSpringConfig,

  morph: {
    damping: 18,
    stiffness: 180,
    mass: 0.9,
  } as WithSpringConfig,
};
