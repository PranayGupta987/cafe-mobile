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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useSocket } from '@/hooks/useSocket';
import { CafeCard } from '@/components/common/Card';
import { StatusBadge } from '@/components/specific/StatusBadge';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Elevation } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { ApiResponse } from '@/types/auth';
import { hapticFeedback } from '@/utils/haptics';

export default function KitchenScreen() {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const [filter, setFilter] = useState<'ACTIVE' | 'PLACED' | 'PREPARING' | 'READY'>('ACTIVE');
  const [isCompact, setIsCompact] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

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

    const handleNewOrder = () => {
      hapticFeedback.heavy();
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
    hapticFeedback.tap();
    try {
      await apiClient.patch(`/orders/${orderId}/status`, {
        status: nextStatus,
      });
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to update order status');
    }
  };

  const toggleItemCheck = (key: string) => {
    hapticFeedback.selection();
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getUrgencyConfig = (createdAt: string) => {
    const elapsedMinutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (elapsedMinutes > 15) {
      return {
        bg: '#FFEBEE',
        borderColor: '#E11900',
        badge: `${elapsedMinutes}m (RUSH)`,
        badgeColor: '#E11900',
      };
    }
    if (elapsedMinutes > 7) {
      return {
        bg: '#FFF8E1',
        borderColor: '#F57F17',
        badge: `${elapsedMinutes}m ago`,
        badgeColor: '#F57F17',
      };
    }
    return {
      bg: '#E8F8F0',
      borderColor: '#06C167',
      badge: `${elapsedMinutes}m ago (Fresh)`,
      badgeColor: '#05944F',
    };
  };

  const filteredOrders = (orders || []).filter((order) => {
    if (filter === 'ACTIVE') return order.status !== 'SERVED' && order.status !== 'CANCELLED';
    return order.status === filter;
  });

  return (
    <View style={styles.container}>
      {/* Header with Socket Connection Indicator & Density Toggle */}
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

        {/* Compact Density Toggle (Improvement 54) */}
        <TouchableOpacity
          style={styles.densityBtn}
          onPress={() => {
            setIsCompact(!isCompact);
            hapticFeedback.tap();
          }}
        >
          <Ionicons name={isCompact ? 'grid' : 'list'} size={18} color={Colors.uberGreen} />
          <Text style={styles.densityBtnText}>{isCompact ? 'Compact' : 'Detailed'}</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        {(['ACTIVE', 'PLACED', 'PREPARING', 'READY'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabChip, filter === tab && styles.tabChipActive]}
            onPress={() => {
              setFilter(tab);
              hapticFeedback.selection();
            }}
          >
            <Text
              style={[
                styles.tabChipText,
                filter === tab && styles.tabChipTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} />}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.uberGreen} style={{ marginTop: 40 }} />
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="fast-food-outline" size={56} color={Colors.textMuted} />
            <Text style={[Typography.bodyMedium, { color: Colors.textMuted, marginTop: Spacing.md }]}>
              No incoming orders in this queue. Kitchen is all clear!
            </Text>
          </View>
        ) : (
          <View style={isCompact ? styles.compactGrid : styles.detailedList}>
            {filteredOrders.map((order) => {
              const urgency = getUrgencyConfig(order.createdAt);
              const itemsList = order.items || [];

              return (
                <View
                  key={order.id}
                  style={[
                    styles.ticketCard,
                    { borderColor: urgency.borderColor, backgroundColor: '#FFFFFF' },
                    isCompact ? styles.ticketCardCompact : styles.ticketCardDetailed,
                  ]}
                >
                  {/* Top Bar with Urgency Color Tag (Improvement 51) */}
                  <View style={[styles.ticketHeader, { backgroundColor: urgency.bg }]}>
                    <View style={styles.ticketHeaderLeft}>
                      <Text style={styles.orderNumberText}>Order #{order.orderNumber}</Text>
                      <Text style={styles.tableBadgeText}>
                        Table {order.table?.tableNumber || 1}
                      </Text>
                    </View>
                    <View style={[styles.urgencyBadge, { borderColor: urgency.badgeColor }]}>
                      <Text style={[styles.urgencyBadgeText, { color: urgency.badgeColor }]}>
                        {urgency.badge}
                      </Text>
                    </View>
                  </View>

                  {/* Checklist of Items (Improvement 53) */}
                  <View style={styles.ticketBody}>
                    {itemsList.map((item: any, idx: number) => {
                      const itemKey = `${order.id}-${idx}`;
                      const isChecked = !!checkedItems[itemKey];

                      return (
                        <TouchableOpacity
                          key={itemKey}
                          style={styles.checkItemRow}
                          onPress={() => toggleItemCheck(itemKey)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={isChecked ? 'checkbox' : 'square-outline'}
                            size={18}
                            color={isChecked ? Colors.uberGreen : Colors.textMuted}
                            style={{ marginRight: 8 }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.checkItemText,
                                isChecked && styles.checkItemTextStrikethrough,
                              ]}
                            >
                              <Text style={styles.itemQty}>{item.quantity}x </Text>
                              {item.menuItem?.name || item.name || 'Barista Item'}
                            </Text>
                            {item.notes ? (
                              <Text style={styles.checkItemNotes}>• {item.notes}</Text>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}

                    {order.specialInstructions ? (
                      <View style={styles.instructionsBox}>
                        <Text style={styles.instructionsText}>
                          ⚠️ Note: {order.specialInstructions}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Action Buttons: Status Transitions */}
                  <View style={styles.ticketActions}>
                    {order.status === 'PLACED' ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#FF9500' }]}
                        onPress={() => handleUpdateStatus(order.id, 'PREPARING')}
                      >
                        <Text style={styles.actionBtnText}>Start Brewing</Text>
                      </TouchableOpacity>
                    ) : null}

                    {order.status === 'PREPARING' ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: Colors.uberGreen }]}
                        onPress={() => handleUpdateStatus(order.id, 'READY')}
                      >
                        <Text style={styles.actionBtnText}>Mark Ready</Text>
                      </TouchableOpacity>
                    ) : null}

                    {order.status === 'READY' ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: Colors.uberBlack }]}
                        onPress={() => handleUpdateStatus(order.id, 'SERVED')}
                      >
                        <Text style={styles.actionBtnText}>Mark Served</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    backgroundColor: '#FFFFFF',
  },
  socketIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socketDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  densityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  densityBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.uberGreenDark,
    marginLeft: 4,
  },
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#F0F0F0',
  },
  tabChipActive: {
    backgroundColor: Colors.uberGreen,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '700',
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
    marginTop: 80,
  },
  detailedList: {
    gap: 16,
  },
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ticketCard: {
    borderRadius: Radius.md,
    borderWidth: 2,
    overflow: 'hidden',
    ...Elevation.sm,
  },
  ticketCardDetailed: {
    width: '100%',
  },
  ticketCardCompact: {
    width: '48%',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ticketHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumberText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tableBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.uberGreenDark,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgencyBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
  },
  urgencyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  ticketBody: {
    padding: Spacing.sm,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  checkItemText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  checkItemTextStrikethrough: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  itemQty: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  checkItemNotes: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 1,
  },
  instructionsBox: {
    backgroundColor: '#FFF3E0',
    padding: 6,
    borderRadius: Radius.xs,
    marginTop: 6,
  },
  instructionsText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
  },
  ticketActions: {
    padding: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionBtn: {
    paddingVertical: 10,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
