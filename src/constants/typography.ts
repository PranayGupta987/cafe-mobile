import { TextStyle, Platform } from 'react-native';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

const SANS_FONT = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'sans-serif',
});

export const Typography: Record<string, TextStyle> = {
  // Editorial Serif Headlines (Artisanal Boutique Aesthetic)
  editorialLarge: {
    fontFamily: SERIF_FONT,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  editorialMedium: {
    fontFamily: SERIF_FONT,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  editorialSmall: {
    fontFamily: SERIF_FONT,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },

  // Sans-serif Modern Display & Body
  h1: {
    fontFamily: SANS_FONT,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: SANS_FONT,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: SANS_FONT,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  titleMedium: {
    fontFamily: SANS_FONT,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  bodyLarge: {
    fontFamily: SANS_FONT,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: SANS_FONT,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: SANS_FONT,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  labelLarge: {
    fontFamily: SANS_FONT,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: SANS_FONT,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontFamily: SANS_FONT,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
    letterSpacing: 0.4,
  },
};
