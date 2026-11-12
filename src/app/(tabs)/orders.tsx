import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useSocket } from '@/hooks/useSocket';
import { useCartStore } from '@/stores/cartStore';
import { StatusBadge } from '@/components/specific/StatusBadge';
import { OrderTimeline } from '@/components/specific/OrderTimeline';
import { CafeAsyncImage } from '@/components/common/CafeAsyncImage';
import { Radius } from '@/constants/dimens';
import { formatPaise } from '@/utils/currency';
import { ApiResponse } from '@/types/auth';
import { MediaAssets } from '@/constants/media';

// Android MD3 + Kyoto Minimalist Color Tokens
const KyotoMD3 = {
  surface: '#F8F5F0',
  surfaceContainer: '#F1ECE1',
  surfaceContainerHigh: '#EAE3D5',
  surfaceBright: '#FFFFFF',
  onSurface: '#1D1B16',
  onSurfaceVariant: '#5A554E',
  outline: '#8E8B85',
  outlineSubtle: 'rgba(0, 0, 0, 0.06)',
  primary: '#1C3B22',
  primaryContainer: '#CFE9D2',
  onPrimary: '#FFFFFF',
  secondary: '#855325',
  ratingStar: '#E5A93C',
};

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const addItem = useCartStore((state) => state.addItem);

  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [ratedOrders, setRatedOrders] = useState<Record<string, number>>({});

  // Fetch orders
  const { data: orders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['customer-orders'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any[]>>('/orders');
      return res.data.data || [];
    },
  });

  // Listen to realtime order updates
  useEffect(() => {
    if (!socket) return;
    const handleStatusUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    };
    socket.on('order:status_update', handleStatusUpdate);
    return () => {
      socket.off('order:status_update', handleStatusUpdate);
    };
  }, [socket, queryClient]);

  const handleReorder = (order: any) => {
    const items = order.items || [];
    items.forEach((item: any) => {
      addItem({
        menuItemId: item.menuItemId || item.id,
        name: item.menuItem?.name || item.name || 'Artisan Coffee',
        pricePaise: item.pricePaise || Math.round(item.subtotalPaise / (item.quantity || 1)),
        imageUrl: item.menuItem?.imageUrl || MediaAssets.fallbackByKeyword(item.menuItem?.name || ''),
        isVeg: item.menuItem?.isVeg ?? true,
      });
    });

    Alert.alert(
      'Items Added to Basket ☕',
      `Re-added ${items.length} items from Order #${order.orderNumber}.`,
      [
        { text: 'Keep Browsing', style: 'cancel' },
        { text: 'Open Basket', onPress: () => router.push('/modal/cart') },
      ]
    );
  };

  const handleRateOrder = (orderId: string, rating: number) => {
    setRatedOrders((prev) => ({ ...prev, [orderId]: rating }));
    Alert.alert('Thank You! ⭐', 'Your appreciation was shared with our master roasters.');
  };

  const filteredOrders = (orders || []).filter((order) => {
    const isCompleted = order.status === 'SERVED' || order.status === 'CANCELLED';
    if (filter === 'ACTIVE') return !isCompleted;
    if (filter === 'COMPLETED') return isCompleted;
    return true;
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header Bar */}
      <View style={[styles.topAppBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 4) }]}>
        <View style={styles.headerTitleCol}>
          <View style={styles.tableChip}>
            <View style={styles.tableDot} />
            <Text style={styles.tableChipText}>Live Roastery Tracking</Text>
          </View>
          <Text style={styles.brandTitleText}>Orders &amp; History</Text>
        </View>

        <Pressable
          style={styles.iconButtonMD3}
          android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true }}
          onPress={() => refetch()}
        >
          <Ionicons name="refresh-outline" size={18} color={KyotoMD3.onSurface} />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRowContainer}>
        {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((tab) => {
          const isActive = filter === tab;
          return (
            <Pressable
              key={tab}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); }} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={KyotoMD3.primary} />
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CafeAsyncImage
              source={{ uri: MediaAssets.heroes.pourOver }}
              style={styles.emptyHeroImage}
              borderRadius={Radius.xl}
              contentFit="cover"
            />
            <Text style={styles.emptyHeading}>No orders in this tab</Text>
            <Text style={styles.emptySub}>
              Place an order from our artisan menu and track preparation live in real-time.
            </Text>
            <TouchableOpacity
              style={styles.browseMenuBtn}
              onPress={() => router.push('/(tabs)/menu')}
            >
              <Text style={styles.browseMenuBtnText}>Explore Artisan Menu</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });
            const isServed = order.status === 'SERVED';
            const userRating = ratedOrders[order.id] || 0;

            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.orderNumberText}>Order #{order.orderNumber}</Text>
                    <Text style={styles.orderDateText}>{dateStr}</Text>
                  </View>
                  <StatusBadge status={order.status} />
                </View>

                {/* Live Timeline */}
                <OrderTimeline status={order.status} tableNumber={order.table?.tableNumber} />

                {/* Items List */}
                <View style={styles.itemsSummaryBox}>
                  {order.items?.map((item: any) => (
                    <View key={item.id} style={styles.itemRow}>
                      <Text style={styles.itemNameText} numberOfLines={1}>
                        {item.quantity}× {item.menuItem?.name || item.name || 'Artisan Drink'}
                      </Text>
                      <Text style={styles.itemPriceText}>{formatPaise(item.subtotalPaise)}</Text>
                    </View>
                  ))}
                </View>

                {/* Footer / Rating or Re-Order */}
                <View style={styles.cardFooter}>
                  <View style={styles.totalCol}>
                    <Text style={styles.totalLabel}>Total Paid</Text>
                    <Text style={styles.totalValue}>{formatPaise(order.totalPaise)}</Text>
                  </View>

                  <View style={styles.actionButtonRow}>
                    {isServed && (
                      <View style={styles.ratingBox}>
                        <Text style={styles.rateLabel}>Rate:</Text>
                        <View style={styles.starsRow}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                              key={star}
                              onPress={() => handleRateOrder(order.id, star)}
                            >
                              <Ionicons
                                name={star <= userRating ? 'star' : 'star-outline'}
                                size={15}
                                color={star <= userRating ? KyotoMD3.ratingStar : KyotoMD3.outline}
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.reorderButton}
                      onPress={() => handleReorder(order)}
                    >
                      <Ionicons name="repeat" size={13} color={KyotoMD3.primary} />
                      <Text style={styles.reorderButtonText}>Reorder</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KyotoMD3.surface,
  },
  topAppBar: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: KyotoMD3.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: KyotoMD3.outlineSubtle,
  },
  headerTitleCol: {
    flexDirection: 'column',
  },
  tableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: KyotoMD3.primaryContainer,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  tableDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: KyotoMD3.primary,
  },
  tableChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: KyotoMD3.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  brandTitleText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: KyotoMD3.onSurface,
  },
  iconButtonMD3: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: KyotoMD3.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { elevation: 1 },
    }),
  },
  filterRowContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.md,
    backgroundColor: KyotoMD3.surfaceBright,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    ...Platform.select({
      android: { elevation: 1 },
    }),
  },
  filterTabActive: {
    backgroundColor: KyotoMD3.primary,
    borderColor: KyotoMD3.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: KyotoMD3.onSurfaceVariant,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyHeroImage: {
    width: '100%',
    height: 160,
    marginBottom: 16,
  },
  emptyHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: KyotoMD3.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  browseMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: KyotoMD3.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radius.full,
  },
  browseMenuBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  orderCard: {
    backgroundColor: KyotoMD3.surfaceBright,
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
    marginBottom: 2,
  },
  orderDateText: {
    fontSize: 11,
    color: KyotoMD3.onSurfaceVariant,
  },
  itemsSummaryBox: {
    backgroundColor: KyotoMD3.surfaceContainer,
    borderRadius: Radius.md,
    padding: 10,
    marginVertical: 10,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: KyotoMD3.onSurface,
    flex: 1,
    marginRight: 10,
  },
  itemPriceText: {
    fontSize: 12,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: KyotoMD3.outlineSubtle,
    paddingTop: 12,
  },
  totalCol: {
    flexDirection: 'column',
  },
  totalLabel: {
    fontSize: 10,
    color: KyotoMD3.onSurfaceVariant,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
  },
  actionButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: KyotoMD3.surfaceContainer,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
  },
  rateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: KyotoMD3.onSurfaceVariant,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: KyotoMD3.primaryContainer,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
  },
  reorderButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: KyotoMD3.primary,
  },
});
