import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useSocket } from '@/hooks/useSocket';
import { CafeCard } from '@/components/common/Card';
import { CafeButton } from '@/components/common/Button';
import { StatusBadge } from '@/components/specific/StatusBadge';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { ApiResponse } from '@/types/auth';

export default function KitchenScreen() {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const [filter, setFilter] = useState<'ACTIVE' | 'PLACED' | 'PREPARING' | 'READY'>('ACTIVE');

  // Fetch kitchen orders
  const { data: orders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any[]>>('/orders');
      return res.data.data || [];
    },
  });

  // Listen to realtime socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (event: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
    };

    const handleStatusUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:status_update', handleStatusUpdate);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:status_update', handleStatusUpdate);
    };
  }, [socket, queryClient]);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await apiClient.patch(`/orders/${orderId}/status`, {
        status: nextStatus,
      });
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to update order status');
    }
  };

  const filteredOrders = (orders || []).filter((order) => {
    if (filter === 'ACTIVE') return order.status !== 'SERVED' && order.status !== 'CANCELLED';
    return order.status === filter;
  });

  return (
    <View style={styles.container}>
      {/* Header with Socket Connection Indicator */}
      <View style={styles.headerBar}>
        <View style={styles.socketIndicator}>
          <View
            style={[
              styles.socketDot,
              { backgroundColor: isConnected ? Colors.success : Colors.error },
            ]}
          />
          <Text style={[Typography.labelSmall, { color: Colors.textSecondary, marginLeft: 6 }]}>
            {isConnected ? 'LIVE SYNC ACTIVE' : 'RECONNECTING...'}
          </Text>
        </View>

        <View style={styles.filterTabs}>
          {(['ACTIVE', 'PLACED', 'PREPARING', 'READY'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabChip, filter === tab && styles.tabChipActive]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.tabChipText, filter === tab && styles.tabChipTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} />}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.cafeBrown} style={{ marginTop: 40 }} />
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color={Colors.textMuted} />
            <Text style={[Typography.h3, { color: Colors.textMuted, marginTop: Spacing.md }]}>
              All clear! No active tickets
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const timeAgo = new Date(order.createdAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <CafeCard key={order.id} variant="elevated" style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <View>
                    <Text style={[Typography.h3, { color: Colors.cafeBrown }]}>
                      Order #{order.orderNumber}
                    </Text>
                    <Text style={[Typography.bodyMedium, { color: Colors.textPrimary, fontWeight: '700' }]}>
                      {order.table ? `Table ${order.table.tableNumber}` : 'Takeaway'} • {timeAgo}
                    </Text>
                  </View>
                  <StatusBadge status={order.status} />
                </View>

                {/* Items Ticket */}
                <View style={styles.itemsTicket}>
                  {order.items?.map((item: any) => (
                    <View key={item.id} style={styles.itemRow}>
                      <Text style={[Typography.titleMedium, { color: Colors.textPrimary }]}>
                        {item.quantity} × {item.menuItem?.name || 'Item'}
                      </Text>
                      {item.notes ? (
                        <Text style={[Typography.bodySmall, { color: Colors.error, fontStyle: 'italic' }]}>
                          Note: {item.notes}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>

                {order.specialInstructions ? (
                  <View style={styles.instructionsBox}>
                    <Text style={[Typography.bodySmall, { color: Colors.cafeBrownDark, fontWeight: '700' }]}>
                      Special Request: {order.specialInstructions}
                    </Text>
                  </View>
                ) : null}

                {/* Kitchen Action Buttons */}
                <View style={styles.actionRow}>
                  {order.status === 'PLACED' ? (
                    <CafeButton
                      title="Start Preparing"
                      size="sm"
                      onPress={() => handleUpdateStatus(order.id, 'PREPARING')}
                      style={{ flex: 1 }}
                    />
                  ) : null}

                  {order.status === 'PREPARING' ? (
                    <CafeButton
                      title="Mark as Ready"
                      size="sm"
                      onPress={() => handleUpdateStatus(order.id, 'READY')}
                      style={{ flex: 1, backgroundColor: Colors.warning }}
                    />
                  ) : null}

                  {order.status === 'READY' ? (
                    <CafeButton
                      title="Mark as Served"
                      size="sm"
                      onPress={() => handleUpdateStatus(order.id, 'SERVED')}
                      style={{ flex: 1, backgroundColor: Colors.success }}
                    />
                  ) : null}
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
  headerBar: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  socketIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  socketDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tabChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabChipActive: {
    backgroundColor: Colors.cafeBrown,
    borderColor: Colors.cafeBrown,
  },
  tabChipText: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  ticketCard: {
    marginBottom: Spacing.base,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: Colors.cafeBrown,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemsTicket: {
    paddingVertical: Spacing.sm,
  },
  itemRow: {
    paddingVertical: 4,
  },
  instructionsBox: {
    backgroundColor: Colors.cafeBrownContainer,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
});
