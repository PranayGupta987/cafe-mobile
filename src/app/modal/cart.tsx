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
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/stores/cartStore';
import { apiClient } from '@/api/client';
import { CafeCard } from '@/components/common/Card';
import { CafeButton } from '@/components/common/Button';
import { QuantityStepper } from '@/components/specific/QuantityStepper';
import { VegIndicator } from '@/components/specific/VegIndicator';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { formatPaise } from '@/utils/currency';
import { ApiResponse } from '@/types/auth';

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
          Your order has been sent to the kitchen and will be served to Table {tableNumber || 1} shortly.
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
        <Ionicons name="cart-outline" size={64} color={Colors.textMuted} />
        <Text style={[Typography.h3, { marginTop: Spacing.base, color: Colors.textPrimary }]}>
          Your cart is empty
        </Text>
        <Text style={[Typography.bodyMedium, { color: Colors.textMuted, marginTop: Spacing.xs }]}>
          Add items from the menu to start an order
        </Text>
        <CafeButton
          title="Browse Menu"
          onPress={() => router.back()}
          style={{ marginTop: Spacing.xl }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Table Assignment Info */}
        <CafeCard variant="flat" style={styles.tableInfoCard}>
          <View style={styles.tableInfoRow}>
            <Ionicons name="restaurant-outline" size={20} color={Colors.cafeBrown} />
            <Text style={[Typography.titleMedium, { marginLeft: Spacing.sm, color: Colors.cafeBrownDark }]}>
              {tableNumber ? `Dine-In at Table ${tableNumber}` : 'Dine-In at Table 1 (Default)'}
            </Text>
          </View>
        </CafeCard>

        {/* Items List */}
        <View style={styles.sectionContainer}>
          <Text style={[Typography.titleMedium, { marginBottom: Spacing.sm }]}>Order Items</Text>
          {items.map((item) => (
            <View key={item.menuItemId} style={styles.cartItemRow}>
              <View style={styles.cartItemDetails}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {item.isVeg !== undefined ? <VegIndicator isVeg={item.isVeg} size={12} /> : null}
                  <Text style={[Typography.titleMedium, { marginLeft: 6, flex: 1 }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <Text style={[Typography.bodyMedium, { color: Colors.cafeBrown, fontWeight: '700', marginTop: 2 }]}>
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
          ))}
        </View>

        {/* Promo Code Input */}
        <CafeCard variant="elevated" style={styles.promoCard}>
          <Text style={[Typography.labelMedium, { marginBottom: Spacing.sm }]}>Promo Code</Text>
          {appliedOffer ? (
            <View style={styles.appliedPromoRow}>
              <View>
                <Text style={[Typography.labelLarge, { color: Colors.success }]}>
                  {appliedOffer.code} Applied
                </Text>
                <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                  {appliedOffer.title} (-{formatPaise(appliedOffer.discountPaise)})
                </Text>
              </View>
              <TouchableOpacity onPress={removeOffer}>
                <Text style={[Typography.labelMedium, { color: Colors.error }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoInputRow}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter coupon code"
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
          <Text style={[Typography.labelMedium, { marginBottom: Spacing.sm }]}>
            Special Cooking Instructions
          </Text>
          <TextInput
            style={styles.instructionsInput}
            placeholder="e.g. Less sugar, extra hot coffee..."
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
              <Text style={[Typography.bodyMedium, { color: Colors.success }]}>Promo Discount</Text>
              <Text style={[Typography.bodyMedium, { color: Colors.success }]}>
                -{formatPaise(discount)}
              </Text>
            </View>
          ) : null}

          <View style={styles.billRow}>
            <Text style={[Typography.bodyMedium, { color: Colors.textSecondary }]}>GST (5%)</Text>
            <Text style={Typography.bodyMedium}>{formatPaise(gst)}</Text>
          </View>

          <View style={[styles.billRow, styles.totalBillRow]}>
            <Text style={Typography.titleMedium}>Total Amount</Text>
            <Text style={[Typography.h2, { color: Colors.cafeBrown }]}>{formatPaise(total)}</Text>
          </View>
        </CafeCard>
      </ScrollView>

      {/* Checkout Footer */}
      <View style={styles.footer}>
        <CafeButton
          title={`Place Order • ${formatPaise(total)}`}
          loading={isPlacingOrder}
          onPress={handlePlaceOrder}
          size="lg"
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
    paddingBottom: 100,
  },
  tableInfoCard: {
    marginBottom: Spacing.base,
    backgroundColor: Colors.cafeBrownContainer,
  },
  tableInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cartItemDetails: {
    flex: 1,
    marginRight: Spacing.md,
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
    height: 40,
    fontSize: 14,
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
  instructionsCard: {
    marginBottom: Spacing.base,
  },
  instructionsInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.base,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
    height: 70,
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
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
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
