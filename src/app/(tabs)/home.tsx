import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { CafeCard } from '@/components/common/Card';
import { CafeButton } from '@/components/common/Button';
import { QuantityStepper } from '@/components/specific/QuantityStepper';
import { VegIndicator } from '@/components/specific/VegIndicator';
import { FloatingCartBar } from '@/components/specific/FloatingCartBar';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { formatPaise } from '@/utils/currency';
import { ApiResponse } from '@/types/auth';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    items: cartItems,
    addItem,
    incrementItem,
    decrementItem,
    getTotalItems,
    getTotalPaise,
    tableNumber,
  } = useCartStore();

  const totalItems = getTotalItems();
  const totalPaise = getTotalPaise();

  // Fetch active cafe profile
  const { data: cafeData } = useQuery({
    queryKey: ['cafe-profile'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any>>('/cafe');
      return res.data.data;
    },
  });

  // Fetch active offers
  const { data: offersData } = useQuery({
    queryKey: ['active-offers'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any[]>>('/offers');
      return res.data.data || [];
    },
  });

  // Fetch featured menu items
  const { data: menuItemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['featured-menu-items'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any[]>>('/menu/items');
      return (res.data.data || []).slice(0, 6);
    },
  });

  const getItemQuantity = (id: string) => {
    return cartItems.find((i) => i.menuItemId === id)?.quantity || 0;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Table Check-In Banner */}
        <CafeCard variant="elevated" style={styles.tableCard}>
          <View style={styles.tableCardContent}>
            <View style={styles.tableIconBox}>
              <Ionicons
                name={tableNumber ? 'restaurant' : 'qr-code-outline'}
                size={28}
                color={Colors.cafeBrown}
              />
            </View>
            <View style={styles.tableInfo}>
              <Text style={Typography.titleMedium}>
                {tableNumber ? `Table ${tableNumber} Active` : 'Dine-In Check-In'}
              </Text>
              <Text style={Typography.bodySmall}>
                {tableNumber
                  ? 'Your orders will be served directly to your table'
                  : 'Scan the QR code on your table to place an order'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/modal/qr-scanner')}
              style={styles.scanButton}
            >
              <Text style={styles.scanButtonText}>{tableNumber ? 'Change' : 'Scan'}</Text>
            </TouchableOpacity>
          </View>
        </CafeCard>

        {/* Quick Action Chips */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.actionChip}
            onPress={() => router.push('/modal/reservations')}
          >
            <Ionicons name="calendar-outline" size={20} color={Colors.cafeBrown} />
            <Text style={styles.actionChipText}>Book Table</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionChip}
            onPress={() => router.push('/(tabs)/menu')}
          >
            <Ionicons name="fast-food-outline" size={20} color={Colors.cafeBrown} />
            <Text style={styles.actionChipText}>Browse Menu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionChip}
            onPress={() => router.push('/(tabs)/offers')}
          >
            <Ionicons name="pricetags-outline" size={20} color={Colors.cafeBrown} />
            <Text style={styles.actionChipText}>Offers</Text>
          </TouchableOpacity>
        </View>

        {/* Offers Section */}
        {offersData && offersData.length > 0 ? (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={Typography.h3}>Exclusive Offers</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/offers')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.offersScroll}>
              {offersData.map((offer) => (
                <View key={offer.id} style={styles.offerCard}>
                  <View style={styles.offerBadge}>
                    <Text style={styles.offerBadgeText}>
                      {offer.discountType === 'PERCENTAGE'
                        ? `${offer.discountValue}% OFF`
                        : `₹${offer.discountValue / 100} OFF`}
                    </Text>
                  </View>
                  <Text style={[Typography.titleMedium, { marginTop: Spacing.sm }]}>
                    {offer.title}
                  </Text>
                  <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                    Use code {offer.code}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Chef's Recommended Specials */}
        <View style={styles.sectionContainer}>
          <Text style={[Typography.h3, { marginBottom: Spacing.md }]}>Chef's Specials</Text>
          {itemsLoading ? (
            <ActivityIndicator size="small" color={Colors.cafeBrown} />
          ) : (
            menuItemsData?.map((item) => {
              const qty = getItemQuantity(item.id);
              return (
                <CafeCard key={item.id} variant="elevated" style={styles.menuItemCard}>
                  <View style={styles.menuItemRow}>
                    <View style={styles.menuItemDetails}>
                      <View style={styles.vegRow}>
                        <VegIndicator isVeg={item.isVeg} size={14} />
                        {item.isSpicy ? (
                          <Ionicons
                            name="flame"
                            size={14}
                            color={Colors.error}
                            style={{ marginLeft: 4 }}
                          />
                        ) : null}
                      </View>
                      <Text style={[Typography.titleMedium, styles.itemName]}>{item.name}</Text>
                      <Text style={[Typography.bodyMedium, styles.itemPrice]}>
                        {formatPaise(item.pricePaise)}
                      </Text>
                      <Text
                        style={[Typography.bodySmall, styles.itemDescription]}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    </View>

                    <View style={styles.stepperBox}>
                      <QuantityStepper
                        quantity={qty}
                        onIncrement={() =>
                          addItem({
                            menuItemId: item.id,
                            name: item.name,
                            pricePaise: item.pricePaise,
                            imageUrl: item.imageUrl,
                            isVeg: item.isVeg,
                          })
                        }
                        onDecrement={() => decrementItem(item.id)}
                      />
                    </View>
                  </View>
                </CafeCard>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Cart Bar */}
      <FloatingCartBar
        totalItems={totalItems}
        totalPaise={totalPaise}
        tableNumber={tableNumber}
        onPress={() => router.push('/modal/cart')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 90,
  },
  tableCard: {
    marginBottom: Spacing.base,
    backgroundColor: '#FFFFFF',
  },
  tableCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.cafeBrownContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  tableInfo: {
    flex: 1,
  },
  scanButton: {
    backgroundColor: Colors.cafeBrown,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  actionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionChipText: {
    marginLeft: 6,
    ...Typography.labelMedium,
    color: Colors.textPrimary,
  },
  sectionContainer: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  seeAllText: {
    ...Typography.labelMedium,
    color: Colors.cafeBrown,
  },
  offersScroll: {
    marginHorizontal: -Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  offerCard: {
    width: 220,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  offerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.cafeGoldContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  offerBadgeText: {
    color: Colors.cafeGoldDark,
    fontWeight: '700',
    fontSize: 12,
  },
  menuItemCard: {
    marginBottom: Spacing.md,
  },
  menuItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemDetails: {
    flex: 1,
    marginRight: Spacing.md,
  },
  vegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    color: Colors.textPrimary,
  },
  itemPrice: {
    color: Colors.cafeBrown,
    fontWeight: '700',
    marginTop: 2,
  },
  itemDescription: {
    color: Colors.textMuted,
    marginTop: 4,
  },
  stepperBox: {
    alignItems: 'flex-end',
  },
});
