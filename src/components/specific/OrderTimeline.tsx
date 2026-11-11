import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/dimens';

interface OrderTimelineProps {
  status: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  tableNumber?: number | null;
}

const STAGES = [
  { key: 'PLACED', label: 'Placed', icon: 'receipt-outline' },
  { key: 'ACCEPTED', label: 'Accepted', icon: 'checkmark-circle-outline' },
  { key: 'PREPARING', label: 'Preparing', icon: 'flame-outline' },
  { key: 'READY', label: 'Ready', icon: 'notifications-outline' },
  { key: 'SERVED', label: 'Served', icon: 'restaurant-outline' },
];

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ status, tableNumber }) => {
  const currentStageIndex = STAGES.findIndex((s) => s.key === status);
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

  // Pulse animation for active node (always called unconditionally at top of component)
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 900 }),
        withTiming(1, { duration: 900 })
      ),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 900 }),
        withTiming(0.6, { duration: 900 })
      ),
      -1,
      true
    );
  }, [pulseScale, pulseOpacity]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  if (status === 'CANCELLED') {
    return (
      <View style={styles.cancelledContainer}>
        <Ionicons name="close-circle" size={24} color={Colors.error} />
        <Text style={styles.cancelledText}>This order was cancelled</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stages Row */}
      <View style={styles.timelineRow}>
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;

          return (
            <React.Fragment key={stage.key}>
              {/* Connector line between steps */}
              {idx > 0 && (
                <View
                  style={[
                    styles.connectorLine,
                    isCompleted || isActive ? styles.connectorActive : styles.connectorInactive,
                  ]}
                />
              )}

              {/* Node Icon */}
              <View style={styles.nodeWrapper}>
                {isActive && (
                  <Animated.View style={[styles.pulseRing, animatedPulseStyle]} />
                )}
                <View
                  style={[
                    styles.nodeCircle,
                    isCompleted && styles.nodeCompleted,
                    isActive && styles.nodeCurrent,
                    !isCompleted && !isActive && styles.nodeUpcoming,
                  ]}
                >
                  <Ionicons
                    name={isCompleted ? 'checkmark' : (stage.icon as any)}
                    size={13}
                    color={isCompleted || isActive ? '#FFFFFF' : Colors.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.nodeLabel,
                    isActive && styles.nodeLabelActive,
                    isCompleted && styles.nodeLabelCompleted,
                  ]}
                  numberOfLines={1}
                >
                  {stage.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>

      {/* ETA Status Callout */}
      <View style={styles.statusCallout}>
        <View style={styles.statusCalloutLeft}>
          <Text style={styles.statusCalloutTitle}>
            {status === 'PLACED' && 'Order Received by Barista'}
            {status === 'ACCEPTED' && 'Order Confirmed & Queued'}
            {status === 'PREPARING' && 'Crafting your artisanal treats...'}
            {status === 'READY' && 'Fresh & Ready for Pickup!'}
            {status === 'SERVED' && `Enjoy your meal at Table ${tableNumber || 1}!`}
          </Text>
          <Text style={styles.statusCalloutSub}>
            {status === 'PREPARING'
              ? 'Estimated ready in ~5-8 mins'
              : status === 'SERVED'
              ? 'Completed • Thank you!'
              : 'Direct counter and kitchen updates'}
          </Text>
        </View>
        <View style={styles.prepBadge}>
          <Ionicons name="flash" size={12} color="#FFFFFF" />
          <Text style={styles.prepBadgeText}>
            {status === 'SERVED' ? 'Done' : 'Live'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  connectorLine: {
    flex: 1,
    height: 2.5,
    marginHorizontal: 2,
    marginBottom: 16,
  },
  connectorActive: {
    backgroundColor: Colors.uberGreen,
  },
  connectorInactive: {
    backgroundColor: Colors.border,
  },
  nodeWrapper: {
    alignItems: 'center',
    position: 'relative',
    width: 52,
  },
  pulseRing: {
    position: 'absolute',
    top: -3,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.uberGreenLight,
  },
  nodeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeCompleted: {
    backgroundColor: Colors.uberGreen,
  },
  nodeCurrent: {
    backgroundColor: Colors.uberGreen,
    shadowColor: Colors.uberGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  nodeUpcoming: {
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nodeLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  nodeLabelActive: {
    color: Colors.uberGreenDark,
    fontWeight: '800',
  },
  nodeLabelCompleted: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  statusCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.uberGreenContainer,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: Spacing.sm,
  },
  statusCalloutLeft: {
    flex: 1,
  },
  statusCalloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.uberGreenDark,
  },
  statusCalloutSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  prepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.uberGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  prepBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cancelledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.errorContainer,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  cancelledText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 13,
  },
});
