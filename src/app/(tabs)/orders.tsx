import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useSocket } from '@/hooks/useSocket';
import { CafeCard } from '@/components/common/Card';
import { StatusBadge } from '@/components/specific/StatusBadge';
import { OrderTimeline } from '@/components/specific/OrderTimeline';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { formatPaise } from '@/utils/currency';
import { ApiResponse } from '@/types/auth';

export default function OrdersScreen() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

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

    const handleStatusUpdate = (event: any) => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    };

    socket.on('order:status_update', handleStatusUpdate);

    return () => {
      socket.off('order:status_update', handleStatusUpdate);
    };
  }, [socket, queryClient]);

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
            onPress={() => setFilter(tab)}
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

                {/* Footer with Table & Total */}
                <View style={styles.cardFooter}>
                  <View style={styles.tableBadge}>
                    <Ionicons name="restaurant-outline" size={13} color={Colors.uberGreenDark} />
                    <Text style={styles.tableText}>
                      {order.table?.tableNumber ? `Table ${order.table.tableNumber}` : 'Dine-In Table 1'}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={[Typography.bodySmall, { color: Colors.textMuted, marginRight: 6 }]}>
                      Total:
                    </Text>
                    <Text style={[Typography.labelLarge, { color: Colors.textPrimary, fontWeight: '800', fontSize: 16 }]}>
                      {formatPaise(order.totalPaise)}
                    </Text>
                  </View>
                </View>
              </CafeCard>
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
    backgroundColor: Colors.background,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.background,
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
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.uberGreenContainer,
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
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
