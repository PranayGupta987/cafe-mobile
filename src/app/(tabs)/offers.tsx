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
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useCartStore } from '@/stores/cartStore';
import { CafeCard } from '@/components/common/Card';
import { CafeButton } from '@/components/common/Button';
import { FloatingCartBar } from '@/components/specific/FloatingCartBar';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/dimens';
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

    Alert.alert('Coupon Applied', `Code ${offer.code} successfully applied to your cart!`);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={Typography.h2}>Special Deals & Coupons</Text>
          <Text style={[Typography.bodyMedium, { color: Colors.textSecondary, marginTop: 4 }]}>
            Apply promo codes to save on artisanal coffee and gourmet treats
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.cafeBrown} style={{ marginTop: 40 }} />
        ) : !offers || offers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={48} color={Colors.textMuted} />
            <Text style={[Typography.bodyMedium, { color: Colors.textMuted, marginTop: Spacing.md }]}>
              No offers currently active. Check back soon!
            </Text>
          </View>
        ) : (
          offers.map((offer) => {
            const isApplied = appliedOffer?.code === offer.code;

            return (
              <CafeCard key={offer.id} variant="elevated" style={styles.offerCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.couponTag}>
                    <Text style={styles.couponCode}>{offer.code}</Text>
                  </View>
                  <Text style={styles.discountHighlight}>
                    {offer.discountType === 'PERCENTAGE'
                      ? `${offer.discountValue}% OFF`
                      : `₹${offer.discountValue / 100} FLAT OFF`}
                  </Text>
                </View>

                <Text style={[Typography.h3, styles.offerTitle]}>{offer.title}</Text>
                {offer.description ? (
                  <Text style={[Typography.bodyMedium, styles.offerDesc]}>
                    {offer.description}
                  </Text>
                ) : null}

                <View style={styles.termsRow}>
                  <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
                  <Text style={[Typography.bodySmall, styles.termsText]}>
                    Min order: {formatPaise(offer.minOrderAmountPaise)}
                    {offer.maxDiscountAmountPaise
                      ? ` • Max discount: ${formatPaise(offer.maxDiscountAmountPaise)}`
                      : ''}
                  </Text>
                </View>

                <View style={styles.actionRow}>
                  {isApplied ? (
                    <CafeButton
                      title="Applied ✓"
                      variant="secondary"
                      size="sm"
                      onPress={removeOffer}
                      style={{ flex: 1 }}
                    />
                  ) : (
                    <CafeButton
                      title="Apply to Cart"
                      size="sm"
                      onPress={() => handleApplyCoupon(offer)}
                      style={{ flex: 1 }}
                    />
                  )}
                </View>
              </CafeCard>
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
    paddingBottom: 90,
  },
  header: {
    marginBottom: Spacing.base,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  offerCard: {
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  couponTag: {
    backgroundColor: Colors.uberGreenContainer,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.xs,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: Colors.uberGreen,
  },
  couponCode: {
    fontWeight: '800',
    color: Colors.uberGreenDark,
    letterSpacing: 1.2,
    fontSize: 13,
  },
  discountHighlight: {
    ...Typography.labelLarge,
    color: Colors.uberGreenDark,
    fontWeight: '800',
    fontSize: 15,
  },
  offerTitle: {
    color: Colors.textPrimary,
    marginTop: 2,
  },
  offerDesc: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  termsText: {
    color: Colors.textMuted,
    marginLeft: 4,
  },
  actionRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
  },
});
