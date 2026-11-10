import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/dimens';
import { Typography } from '@/constants/typography';

export default function Index() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    async function determineRoute() {
      const loggedIn = await checkAuth();
      if (!loggedIn) {
        router.replace('/(auth)/login');
      } else {
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.role === 'KITCHEN' || currentUser?.role === 'CAFE_STAFF') {
          router.replace('/kitchen');
        } else {
          router.replace('/(tabs)/home');
        }
      }
    }

    const timer = setTimeout(determineRoute, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="cafe" size={64} color={Colors.cafeBrown} />
      </View>
      <Text style={[Typography.h1, styles.brandName]}>Café App</Text>
      <Text style={[Typography.bodyMedium, styles.tagline]}>Artisanal Coffee & Gourmet Food</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.cafeBrownContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  brandName: {
    color: Colors.cafeBrown,
  },
  tagline: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
