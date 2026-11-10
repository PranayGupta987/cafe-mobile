import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SocketProvider } from '@/hooks/useSocket';
import { Colors } from '@/constants/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: Colors.surface },
              headerTintColor: Colors.cafeBrown,
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: Colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="kitchen/index"
              options={{
                title: 'Kitchen Display System',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="modal/cart"
              options={{
                presentation: 'modal',
                title: 'My Cart',
              }}
            />
            <Stack.Screen
              name="modal/qr-scanner"
              options={{
                presentation: 'modal',
                title: 'Scan Table QR',
              }}
            />
            <Stack.Screen
              name="modal/reservations"
              options={{
                presentation: 'modal',
                title: 'Book a Table',
              }}
            />
          </Stack>
        </SocketProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
