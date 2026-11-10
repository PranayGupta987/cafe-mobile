import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { useCartStore } from '@/stores/cartStore';

function HeaderCartButton() {
  const router = useRouter();
  const totalItems = useCartStore((s) => s.getTotalItems());

  return (
    <TouchableOpacity
      style={styles.headerCartButton}
      onPress={() => router.push('/modal/cart')}
      accessibilityRole="button"
      accessibilityLabel={`Shopping cart, ${totalItems} items`}
    >
      <Ionicons name="cart-outline" size={24} color={Colors.cafeBrown} />
      {totalItems > 0 ? (
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{totalItems}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: Colors.cafeBrown,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerRight: () => <HeaderCartButton />,
        tabBarActiveTintColor: Colors.cafeBrown,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerTitle: 'Café App',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cafe' : 'cafe-outline'} size={24} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={24} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: 'Offers',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'pricetag' : 'pricetag-outline'} size={24} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerCartButton: {
    marginRight: 16,
    padding: 6,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.error,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
