import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useCartStore } from '@/stores/cartStore';
import { CafeCard } from '@/components/common/Card';
import { CafeButton } from '@/components/common/Button';
import { FloatingCartBar } from '@/components/specific/FloatingCartBar';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Elevation } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { formatPaise } from '@/utils/currency';
import { ApiResponse } from '@/types/auth';

export default function OffersScreen() {
  const router = useRouter();
  const {
    appliedOffer,
    applyOffer,
    removeOffer,
    getSubtotalPaise,
    getTotalItems,
    getTotalPaise,
    tableNumber,
  } = useCartStore();

  const { data: offers, isLoading } = useQuery({
    queryKey: ['all-offers'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any[]>>('/offers');
      return res.data.data || [];
    },
  });

  const handleApplyCoupon = (offer: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const subtotal = getSubtotalPaise();
    if (subtotal < offer.minOrderAmountPaise) {
      Alert.alert(
        'Minimum Order Required',
        `Add items worth at least ${formatPaise(offer.minOrderAmountPaise)} to apply coupon ${offer.code}.`
      );
      return;
    }

    let discountPaise = 0;
    if (offer.discountType === 'PERCENTAGE') {
      const calc = (subtotal * offer.discountValue) / 100;
      discountPaise =
        offer.maxDiscountAmountPaise && offer.maxDiscountAmountPaise > 0
          ? Math.min(calc, offer.maxDiscountAmountPaise)
          : calc;
    } else {
      discountPaise = offer.discountValue;
    }

    applyOffer({
      code: offer.code,
      title: offer.title,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      discountPaise: Math.round(discountPaise),
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Coupon Applied 🎉', `Code ${offer.code} successfully applied to your basket!`);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[Typography.h2, { color: Colors.textPrimary, fontWeight: '900' }]}>
            Exclusive Deals & Vouchers
          </Text>
          <Text style={[Typography.bodyMedium, { color: Colors.textSecondary, marginTop: 4 }]}>
            Redeem artisanal promo perks to save on craft pour-overs and warm bakes.
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.uberGreen} style={{ marginTop: 40 }} />
        ) : !offers || offers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={48} color={Colors.textMuted} />
            <Text style={[Typography.bodyMedium, { color: Colors.textMuted, marginTop: Spacing.md }]}>
              No vouchers active at the moment. Check back soon!
            </Text>
          </View>
        ) : (
          offers.map((offer) => {
            const isApplied = appliedOffer?.code === offer.code;

            return (
              <View key={offer.id} style={styles.ticketContainer}>
                {/* Perforated Side Notches */}
                <View style={styles.notchLeft} />
                <View style={styles.notchRight} />

                <View style={styles.ticketInner}>
                  <View style={styles.cardHeader}>
                    <View style={styles.couponTag}>
                      <Ionicons name="pricetag" size={12} color={Colors.uberGreenDark} style={{ marginRight: 4 }} />
                      <Text style={styles.couponCode}>{offer.code}</Text>
                    </View>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountHighlight}>
                        {offer.discountType === 'PERCENTAGE'
                          ? `${offer.discountValue}% OFF`
                          : `₹${offer.discountValue / 100} FLAT OFF`}
                      </Text>
                    </View>
                  </View>

                  <Text style={[Typography.h3, styles.offerTitle]}>{offer.title}</Text>
                  {offer.description ? (
                    <Text style={[Typography.bodyMedium, styles.offerDesc]}>
                      {offer.description}
                    </Text>
                  ) : null}

                  {/* Dashed Perforation Line */}
                  <View style={styles.dashedPerforation} />

                  <View style={styles.termsRow}>
                    <Ionicons name="shield-checkmark-outline" size={14} color={Colors.uberGreenDark} />
                    <Text style={[Typography.bodySmall, styles.termsText]}>
                      Min order: {formatPaise(offer.minOrderAmountPaise)}
                      {offer.maxDiscountAmountPaise
                        ? ` • Max discount: ${formatPaise(offer.maxDiscountAmountPaise)}`
                        : ''}
                    </Text>
                  </View>

                  <View style={styles.actionRow}>
                    {isApplied ? (
                      <TouchableOpacity
                        style={styles.appliedButton}
                        onPress={() => {
                          Haptics.selectionAsync();
                          removeOffer();
                        }}
                      >
                        <Ionicons name="checkmark-circle" size={16} color={Colors.uberGreenDark} />
                        <Text style={styles.appliedButtonText}>Applied to Basket</Text>
                        <Text style={styles.removeTagText}>(Tap to Remove)</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.applyButton}
                        onPress={() => handleApplyCoupon(offer)}
                      >
                        <Text style={styles.applyButtonText}>Apply Code</Text>
                        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Cart Bar */}
      <FloatingCartBar
        totalItems={getTotalItems()}
        totalPaise={getTotalPaise()}
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
    paddingBottom: 130,
  },
  header: {
    marginBottom: Spacing.base,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  ticketContainer: {
    position: 'relative',
    marginBottom: Spacing.base,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Elevation.sm,
  },
  notchLeft: {
    position: 'absolute',
    left: -12,
    top: '48%',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    zIndex: 10,
  },
  notchRight: {
    position: 'absolute',
    right: -12,
    top: '48%',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    zIndex: 10,
  },
  ticketInner: {
    padding: Spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  couponTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.uberGreenContainer,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.xs,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: Colors.uberGreen,
  },
  couponCode: {
    fontWeight: '900',
    color: Colors.uberGreenDark,
    letterSpacing: 1.2,
    fontSize: 13,
  },
  discountBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  discountHighlight: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  offerTitle: {
    color: Colors.textPrimary,
    marginTop: 4,
    fontWeight: '800',
  },
  offerDesc: {
    color: Colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  dashedPerforation: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    marginVertical: 12,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  termsText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  actionRow: {
    marginTop: Spacing.md,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.uberGreen,
    paddingVertical: 12,
    borderRadius: Radius.md,
    gap: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  appliedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.uberGreenContainer,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.uberGreen,
    gap: 6,
  },
  appliedButtonText: {
    color: Colors.uberGreenDark,
    fontSize: 14,
    fontWeight: '800',
  },
  removeTagText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
