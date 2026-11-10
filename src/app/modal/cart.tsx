import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/stores/cartStore';
import { apiClient } from '@/api/client';
import { CafeCard } from '@/components/common/Card';
import { CafeButton } from '@/components/common/Button';
import { QuantityStepper } from '@/components/specific/QuantityStepper';
import { VegIndicator } from '@/components/specific/VegIndicator';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Elevation } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { formatPaise } from '@/utils/currency';
import { ApiResponse } from '@/types/auth';
import { ConfettiHost } from '@/components/feedback/Confetti';
import { MediaAssets } from '@/constants/media';

export default function CartModal() {
  const router = useRouter();
  const {
    items,
    tableId,
    tableNumber,
    appliedOffer,
    specialInstructions,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    applyOffer,
    removeOffer,
    setSpecialInstructions,
    getSubtotalPaise,
    getDiscountPaise,
    getSubtotalAfterDiscountPaise,
    getGstPaise,
    getTotalPaise,
  } = useCartStore();

  const [promoInput, setPromoInput] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<number | null>(null);

  const subtotal = getSubtotalPaise();
  const discount = getDiscountPaise();
  const subtotalAfterDiscount = getSubtotalAfterDiscountPaise();
  const gst = getGstPaise();
  const total = getTotalPaise();

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      Alert.alert('Error', 'Please enter a promo code');
      return;
    }

    setIsApplyingPromo(true);
    try {
      const res = await apiClient.get<ApiResponse<any[]>>('/offers');
      const offers = res.data.data || [];
      const matched = offers.find((o) => o.code.toUpperCase() === code);

      if (!matched) {
        Alert.alert('Invalid Code', `Promo code "${code}" is invalid or expired.`);
        setIsApplyingPromo(false);
        return;
      }

      if (subtotal < matched.minOrderAmountPaise) {
        Alert.alert(
          'Minimum Order Required',
          `Minimum order of ${formatPaise(matched.minOrderAmountPaise)} required for this offer.`
        );
        setIsApplyingPromo(false);
        return;
      }

      let discountPaise = 0;
      if (matched.discountType === 'PERCENTAGE') {
        const calc = (subtotal * matched.discountValue) / 100;
        discountPaise =
          matched.maxDiscountAmountPaise && matched.maxDiscountAmountPaise > 0
            ? Math.min(calc, matched.maxDiscountAmountPaise)
            : calc;
      } else {
        discountPaise = matched.discountValue;
      }

      applyOffer({
        code: matched.code,
        title: matched.title,
        discountType: matched.discountType,
        discountValue: matched.discountValue,
        discountPaise: Math.round(discountPaise),
      });

      setPromoInput('');
      Alert.alert('Success', `Coupon ${matched.code} applied!`);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to validate promo code');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    setIsPlacingOrder(true);
    try {
      const payload = {
        tableId: tableId || undefined,
        tableNumber: tableNumber || 1,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          notes: i.notes || undefined,
        })),
        offerCode: appliedOffer?.code || undefined,
        specialInstructions: specialInstructions.trim() || undefined,
      };

      const res = await apiClient.post<ApiResponse<any>>('/orders', payload);
      const orderData = res.data.data;

      if (res.data.success && orderData) {
        setPlacedOrderNumber(orderData.orderNumber);
        clearCart();
      } else {
        Alert.alert('Order Failed', res.data.message || 'Could not place order');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to place order';
      Alert.alert('Order Failed', msg);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (placedOrderNumber !== null) {
    return (
      <View style={styles.successContainer}>
        <ConfettiHost visible={true} />
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark" size={64} color={Colors.success} />
        </View>
        <Text style={[Typography.h1, { color: Colors.textPrimary, textAlign: 'center' }]}>
          Order Successfully Placed!
        </Text>
        <Text style={[Typography.h2, { color: Colors.cafeBrown, marginTop: Spacing.sm }]}>
          Order #{placedOrderNumber}
        </Text>
        <Text style={[Typography.bodyMedium, styles.successSubtitle]}>
          Your artisanal order has been dispatched to the barista and will be served to Table {tableNumber || 1} shortly.
        </Text>
        <CafeButton
          title="View My Orders"
          onPress={() => {
            router.replace('/(tabs)/orders');
          }}
          style={styles.successButton}
        />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="cart-outline" size={48} color={Colors.cafeBrown} />
        </View>
        <Text style={[Typography.h3, { marginTop: Spacing.base, color: Colors.textPrimary }]}>
          Your basket is empty
        </Text>
        <Text style={[Typography.bodyMedium, { color: Colors.textMuted, marginTop: Spacing.xs, textAlign: 'center', maxWidth: 260 }]}>
          Explore our seasonal pour-overs, fresh sourdough, and chef specialties
        </Text>
        <CafeButton
          title="Explore Menu"
          onPress={() => router.replace('/(tabs)/menu')}
          style={{ marginTop: Spacing.xl, minWidth: 200 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Table Assignment Info */}
        <View style={styles.tableInfoCard}>
          <View style={styles.tableInfoRow}>
            <View style={styles.tableBadge}>
              <Ionicons name="cafe" size={16} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={styles.tableDineText}>
                {tableNumber ? `Dine-In • Table ${tableNumber}` : 'Dine-In • Table 1 (Barista Counter)'}
              </Text>
              <Text style={styles.tableHintText}>Served directly to your table</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/modal/qr-scanner')}>
              <Text style={styles.changeTableText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Items List */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Order Items ({items.reduce((s, i) => s + i.quantity, 0)})</Text>
          {items.map((item) => {
            const img = item.imageUrl || MediaAssets.fallbackByKeyword(item.name);
            return (
              <View key={item.menuItemId} style={styles.cartItemRow}>
                {/* Food Thumbnail */}
                <Image
                  source={{ uri: img }}
                  style={styles.itemThumb}
                  contentFit="cover"
                  transition={200}
                />

                <View style={styles.cartItemDetails}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {item.isVeg !== undefined ? <VegIndicator isVeg={item.isVeg} size={11} /> : null}
                    <Text style={styles.cartItemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                  {item.notes ? (
                    <Text style={styles.cartItemNotes} numberOfLines={1}>
                      {item.notes}
                    </Text>
                  ) : null}
                  <Text style={styles.cartItemPrice}>
                    {formatPaise(item.pricePaise * item.quantity)}
                  </Text>
                </View>

                <QuantityStepper
                  quantity={item.quantity}
                  size="sm"
                  onIncrement={() => incrementItem(item.menuItemId)}
                  onDecrement={() => decrementItem(item.menuItemId)}
                />
              </View>
            );
          })}
        </View>

        {/* Promo Code Input */}
        <CafeCard variant="elevated" style={styles.promoCard}>
          <Text style={[Typography.labelMedium, { marginBottom: Spacing.sm, color: Colors.textSecondary }]}>
            Have a voucher or coupon?
          </Text>
          {appliedOffer ? (
            <View style={styles.appliedPromoRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="pricetag" size={20} color={Colors.success} />
                <View>
                  <Text style={[Typography.labelLarge, { color: Colors.success }]}>
                    {appliedOffer.code} Applied
                  </Text>
                  <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                    {appliedOffer.title} (-{formatPaise(appliedOffer.discountPaise)})
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={removeOffer} style={styles.removeCouponBtn}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoInputRow}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter coupon code (e.g. TASTE10)"
                placeholderTextColor={Colors.textMuted}
                value={promoInput}
                onChangeText={setPromoInput}
                autoCapitalize="characters"
              />
              <CafeButton
                title="Apply"
                size="sm"
                loading={isApplyingPromo}
                onPress={handleApplyPromo}
                style={{ marginLeft: Spacing.sm }}
              />
            </View>
          )}
        </CafeCard>

        {/* Special Instructions */}
        <CafeCard variant="elevated" style={styles.instructionsCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm }}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.cafeBrown} />
            <Text style={[Typography.labelMedium, { color: Colors.textPrimary }]}>
              Notes for the Barista / Kitchen
            </Text>
          </View>
          <TextInput
            style={styles.instructionsInput}
            placeholder="e.g. Extra hot, oat milk preferred, sauce on the side..."
            placeholderTextColor={Colors.textMuted}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={2}
          />
        </CafeCard>

        {/* Bill Breakdown */}
        <CafeCard variant="elevated" style={styles.billCard}>
          <Text style={[Typography.h3, { marginBottom: Spacing.md }]}>Bill Summary</Text>

          <View style={styles.billRow}>
            <Text style={[Typography.bodyMedium, { color: Colors.textSecondary }]}>Item Subtotal</Text>
            <Text style={Typography.bodyMedium}>{formatPaise(subtotal)}</Text>
          </View>

          {discount > 0 ? (
            <View style={styles.billRow}>
              <Text style={[Typography.bodyMedium, { color: Colors.success }]}>Promo Savings</Text>
              <Text style={[Typography.bodyMedium, { color: Colors.success, fontWeight: '700' }]}>
                -{formatPaise(discount)}
              </Text>
            </View>
          ) : null}

          <View style={styles.billRow}>
            <Text style={[Typography.bodyMedium, { color: Colors.textSecondary }]}>GST (5%)</Text>
            <Text style={Typography.bodyMedium}>{formatPaise(gst)}</Text>
          </View>

          <View style={[styles.billRow, styles.totalBillRow]}>
            <Text style={[Typography.titleMedium, { fontWeight: '800' }]}>To Pay</Text>
            <Text style={[Typography.h2, { color: Colors.cafeBrown, fontWeight: '800' }]}>
              {formatPaise(total)}
            </Text>
          </View>
        </CafeCard>
      </ScrollView>

      {/* Checkout Footer */}
      <View style={styles.footer}>
        <View style={styles.footerSummary}>
          <Text style={styles.footerItemCount}>{items.reduce((s, i) => s + i.quantity, 0)} Items</Text>
          <Text style={styles.footerTotal}>{formatPaise(total)}</Text>
        </View>
        <CafeButton
          title="Place Order"
          loading={isPlacingOrder}
          onPress={handlePlaceOrder}
          size="lg"
          style={styles.placeOrderBtn}
        />
      </View>
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
    paddingBottom: 110,
  },
  tableInfoCard: {
    marginBottom: Spacing.base,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Elevation.sm,
  },
  tableInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cafeBrown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableDineText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tableHintText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  changeTableText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.cafeBrown,
  },
  sectionContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Elevation.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
  },
  cartItemDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: Spacing.sm,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cartItemNotes: {
    fontSize: 11,
    color: Colors.caramel,
    fontWeight: '600',
    marginTop: 2,
  },
  cartItemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.cafeBrown,
    marginTop: 3,
  },
  promoCard: {
    marginBottom: Spacing.base,
  },
  promoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    height: 42,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  appliedPromoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.successContainer,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  removeCouponBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeCouponText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.error,
  },
  instructionsCard: {
    marginBottom: Spacing.base,
  },
  instructionsInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 13,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
    height: 64,
  },
  billCard: {
    marginBottom: Spacing.base,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  totalBillRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...Elevation.lg,
  },
  footerSummary: {
    flex: 0.8,
  },
  footerItemCount: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  footerTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.cafeBrown,
  },
  placeOrderBtn: {
    flex: 1.2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.cafeBrownContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.successContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  successSubtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    maxWidth: 300,
  },
  successButton: {
    marginTop: Spacing.xl,
    width: '100%',
  },
});
