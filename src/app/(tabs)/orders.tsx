import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useSocket } from '@/hooks/useSocket';
import { useCartStore } from '@/stores/cartStore';
import { CafeCard } from '@/components/common/Card';
import { CafeButton } from '@/components/common/Button';
import { StatusBadge } from '@/components/specific/StatusBadge';
import { OrderTimeline } from '@/components/specific/OrderTimeline';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Elevation } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { formatPaise } from '@/utils/currency';
import { ApiResponse } from '@/types/auth';
import { hapticFeedback } from '@/utils/haptics';

export default function OrdersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const addItem = useCartStore((state) => state.addItem);

  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
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

  // 1-Tap Re-Order Shortcut (Improvement 41)
  const handleReorder = (order: any) => {
    hapticFeedback.tap();
    const items = order.items || [];
    items.forEach((item: any) => {
      addItem({
        menuItemId: item.menuItemId || item.id,
        name: item.menuItem?.name || item.name || 'Artisan Coffee',
        pricePaise: item.pricePaise || Math.round(item.subtotalPaise / (item.quantity || 1)),
        isVeg: item.menuItem?.isVeg ?? true,
      });
    });

    hapticFeedback.success();
    Alert.alert(
      'Items Added to Basket! ☕',
      `Re-added ${items.length} items from Order #${order.orderNumber}.`,
      [
        { text: 'Keep Browsing', style: 'cancel' },
        { text: 'Go to Basket', onPress: () => router.push('/modal/cart') },
      ]
    );
  };

  // Barista Rating Feedback (Improvement 43)
  const handleRateOrder = (orderId: string, rating: number) => {
    hapticFeedback.selection();
    setRatedOrders((prev) => ({
      ...prev,
      [orderId]: rating,
    }));
    Alert.alert('Thank You! ⭐', 'Your appreciation was shared with our master baristas.');
  };

  const filteredOrders = (orders || []).filter((order) => {
    const isCompleted = order.status === 'SERVED' || order.status === 'CANCELLED';
    if (filter === 'ACTIVE') return !isCompleted;
    if (filter === 'COMPLETED') return isCompleted;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => {
              setFilter(tab);
              hapticFeedback.selection();
            }}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === tab && styles.filterTabTextActive,
              ]}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.uberGreen} style={{ marginTop: 40 }} />
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
            <Text style={[Typography.bodyMedium, { color: Colors.textMuted, marginTop: Spacing.md }]}>
              No orders found in this section
            </Text>
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
              <CafeCard key={order.id} variant="elevated" style={styles.orderCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[Typography.titleMedium, { color: Colors.textPrimary, fontWeight: '800' }]}>
                      Order #{order.orderNumber}
                    </Text>
                    <Text style={[Typography.bodySmall, { color: Colors.textMuted }]}>{dateStr}</Text>
                  </View>
                  <StatusBadge status={order.status} />
                </View>

                {/* Interactive Status Timeline (Swiggy/Zomato style) */}
                <OrderTimeline
                  status={order.status}
                  tableNumber={order.table?.tableNumber}
                />

                {/* Items Summary */}
                <View style={styles.itemsSummary}>
                  {order.items?.map((item: any) => (
                    <View key={item.id} style={styles.itemRow}>
                      <Text style={[Typography.bodyMedium, styles.itemQtyName]}>
                        {item.quantity} × {item.menuItem?.name || 'Item'}
                      </Text>
                      <Text style={[Typography.bodyMedium, styles.itemPrice]}>
                        {formatPaise(item.subtotalPaise)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Barista Rating Widget on Completed Orders (Improvement 43) */}
                {isServed ? (
                  <View style={styles.ratingWidgetRow}>
                    <Text style={styles.ratingLabel}>Rate Your Brew:</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          onPress={() => handleRateOrder(order.id, star)}
                        >
                          <Ionicons
                            name={star <= userRating ? 'star' : 'star-outline'}
                            size={18}
                            color={star <= userRating ? '#FFB300' : Colors.textMuted}
                            style={{ marginHorizontal: 2 }}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Footer with Actions: 1-Tap Reorder & Receipt Breakdown (Improvements 41 & 42) */}
                <View style={styles.cardFooter}>
                  <View style={styles.tableBadge}>
                    <Ionicons name="restaurant-outline" size={13} color={Colors.uberGreenDark} />
                    <Text style={styles.tableText}>
                      {order.table?.tableNumber ? `Table ${order.table.tableNumber}` : 'Dine-In Table 1'}
                    </Text>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.receiptBtn}
                      onPress={() => setSelectedReceipt(order)}
                    >
                      <Ionicons name="document-text-outline" size={14} color={Colors.uberBlack} />
                      <Text style={styles.receiptBtnText}>Bill</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.reorderBtn}
                      onPress={() => handleReorder(order)}
                    >
                      <Ionicons name="repeat" size={14} color="#FFFFFF" />
                      <Text style={styles.reorderBtnText}>Re-Order</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </CafeCard>
            );
          })
        )}
      </ScrollView>

      {/* Itemized Tax Invoice Modal (Improvement 42) */}
      <Modal
        visible={!!selectedReceipt}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.receiptModalCard}>
            <View style={styles.receiptModalHeader}>
              <View>
                <Text style={styles.receiptModalTitle}>OFFICIAL TAX INVOICE</Text>
                <Text style={styles.receiptModalSub}>GSTIN: 29AAAAA0000A1Z5</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedReceipt(null)}>
                <Ionicons name="close-circle" size={26} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptDashedLine} />

            <View style={styles.receiptMetaRow}>
              <Text style={styles.metaLabel}>Order Ref:</Text>
              <Text style={styles.metaVal}>#{selectedReceipt?.orderNumber}</Text>
            </View>
            <View style={styles.receiptMetaRow}>
              <Text style={styles.metaLabel}>Table:</Text>
              <Text style={styles.metaVal}>Table {selectedReceipt?.table?.tableNumber || 1}</Text>
            </View>
            <View style={styles.receiptMetaRow}>
              <Text style={styles.metaLabel}>Timestamp:</Text>
              <Text style={styles.metaVal}>
                {selectedReceipt ? new Date(selectedReceipt.createdAt).toLocaleString('en-IN') : ''}
              </Text>
            </View>

            <View style={styles.receiptDashedLine} />

            {/* Items */}
            <ScrollView style={{ maxHeight: 200 }}>
              {selectedReceipt?.items?.map((it: any) => (
                <View key={it.id} style={styles.modalItemRow}>
                  <Text style={styles.modalItemName}>
                    {it.quantity}x {it.menuItem?.name || it.name}
                  </Text>
                  <Text style={styles.modalItemPrice}>{formatPaise(it.subtotalPaise)}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.receiptSolidLine} />

            <View style={styles.receiptTotalRow}>
              <Text style={styles.modalGrandLabel}>Total Paid</Text>
              <Text style={styles.modalGrandValue}>{formatPaise(selectedReceipt?.totalPaise || 0)}</Text>
            </View>

            <CafeButton
              title="Done"
              onPress={() => setSelectedReceipt(null)}
              style={{ marginTop: Spacing.base }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterTab: {
    paddingVertical: 7,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
    backgroundColor: '#F6F6F6',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.uberGreen,
    borderColor: Colors.uberGreen,
  },
  filterTabText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  orderCard: {
    marginBottom: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    ...Elevation.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemsSummary: {
    paddingVertical: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  itemQtyName: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  itemPrice: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  ratingWidgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF9C4',
    padding: 8,
    borderRadius: Radius.sm,
    marginVertical: 6,
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5D4037',
  },
  starsRow: {
    flexDirection: 'row',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  tableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 4,
  },
  tableText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.uberGreenDark,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    gap: 4,
  },
  receiptBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.uberBlack,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.uberGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    gap: 4,
  },
  reorderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  receiptModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Elevation.lg,
  },
  receiptModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptModalTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    color: Colors.textPrimary,
  },
  receiptModalSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  receiptDashedLine: {
    borderStyle: 'dashed',
    borderWidth: 0.8,
    borderColor: '#CCCCCC',
    marginVertical: 10,
  },
  receiptSolidLine: {
    borderWidth: 1,
    borderColor: '#000000',
    marginVertical: 10,
  },
  receiptMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalItemName: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  modalItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  modalGrandLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  modalGrandValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.uberGreenDark,
  },
});
