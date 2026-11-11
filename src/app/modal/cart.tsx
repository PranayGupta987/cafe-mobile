import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/stores/cartStore';
import { apiClient } from '@/api/client';
import { CafeCard } from '@/components/common/Card';
import { CafeButton } from '@/components/common/Button';
import { CafeAsyncImage } from '@/components/common/CafeAsyncImage';
import { QuantityStepper } from '@/components/specific/QuantityStepper';
import { VegIndicator } from '@/components/specific/VegIndicator';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Elevation } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { formatPaise } from '@/utils/currency';
import { ApiResponse } from '@/types/auth';
import { ConfettiHost } from '@/components/feedback/Confetti';
import { MediaAssets } from '@/constants/media';
import { hapticFeedback } from '@/utils/haptics';

const TIP_OPTIONS = [
  { label: 'No Tip', amountPaise: 0 },
  { label: '₹20 (Coffee Bean)', amountPaise: 2000 },
  { label: '₹40 (Barista Love)', amountPaise: 4000 },
  { label: '₹60 (Master Brewer)', amountPaise: 6000 },
];

const UPSELL_ITEMS = [
  {
    id: 'upsell-1',
    name: 'Warm Almond Croissant',
    pricePaise: 18000,
    isVeg: true,
    image: MediaAssets.heroes.bakeryDisplay,
  },
  {
    id: 'upsell-2',
    name: 'Vanilla Sweet Cream Foam',
    pricePaise: 6000,
    isVeg: true,
    image: MediaAssets.heroes.latteArt,
  },
  {
    id: 'upsell-3',
    name: 'Sparkling Mineral Water',
    pricePaise: 8000,
    isVeg: true,
    image: MediaAssets.heroes.coldBrew,
  },
];

export default function CartModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    items,
    tableId,
    tableNumber,
    appliedOffer,
    specialInstructions,
    addItem,
    incrementItem,
    decrementItem,
    clearCart,
    applyOffer,
    removeOffer,
    getSubtotalPaise,
    getDiscountPaise,
    getGstPaise,
    getTotalPaise,
  } = useCartStore();

  const [fulfillmentMode, setFulfillmentMode] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [selectedTipPaise, setSelectedTipPaise] = useState(0);
  const [promoInput, setPromoInput] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<number | null>(null);

  const subtotal = getSubtotalPaise();
  const discount = getDiscountPaise();
  const gst = getGstPaise();
  const grandTotal = getTotalPaise() + selectedTipPaise;

  const handleClearCartPrompt = () => {
    hapticFeedback.warning();
    Alert.alert(
      'Clear Basket?',
      'Are you sure you want to remove all items from your order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearCart();
            hapticFeedback.tap();
          },
        },
      ]
    );
  };

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      Alert.alert('Error', 'Please enter a promo code');
      return;
    }

    setIsApplyingPromo(true);
    hapticFeedback.tap();

    try {
      const res = await apiClient.get<ApiResponse<any[]>>('/offers');
      const offers = res.data.data || [];
      const matched = offers.find((o) => o.code.toUpperCase() === code);

      if (!matched) {
        hapticFeedback.error();
        Alert.alert('Invalid Code', `Promo code "${code}" is invalid or expired.`);
        setIsApplyingPromo(false);
        return;
      }

      if (subtotal < matched.minOrderAmountPaise) {
        hapticFeedback.warning();
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

      hapticFeedback.success();
      setPromoInput('');
      Alert.alert('Success 🎉', `Coupon ${matched.code} applied!`);
    } catch {
      hapticFeedback.error();
      Alert.alert('Error', 'Failed to validate promo code');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleAddUpsell = (upsell: (typeof UPSELL_ITEMS)[0]) => {
    hapticFeedback.tap();
    addItem({
      menuItemId: upsell.id,
      name: upsell.name,
      pricePaise: upsell.pricePaise,
      isVeg: upsell.isVeg,
      imageUrl: upsell.image,
    });
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    setIsPlacingOrder(true);
    hapticFeedback.heavy();

    try {
      const payload = {
        tableId: fulfillmentMode === 'DINE_IN' ? tableId || undefined : undefined,
        tableNumber: fulfillmentMode === 'DINE_IN' ? tableNumber || 1 : 0,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          notes: i.notes || undefined,
        })),
        offerCode: appliedOffer?.code || undefined,
        specialInstructions: `[${fulfillmentMode}] ${specialInstructions.trim()}`.trim() || undefined,
      };

      const res = await apiClient.post<ApiResponse<any>>('/orders', payload);
      const orderData = res.data.data;

      if (res.data.success && orderData) {
        hapticFeedback.success();
        setPlacedOrderNumber(orderData.orderNumber);
        clearCart();
      } else {
        hapticFeedback.error();
        Alert.alert('Order Failed', res.data.message || 'Could not place order');
      }
    } catch (err: any) {
      hapticFeedback.error();
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
          <Ionicons name="checkmark" size={64} color="#FFFFFF" />
        </View>
        <Text style={[Typography.editorialLarge, { color: Colors.textPrimary, textAlign: 'center' }]}>
          Order Confirmed!
        </Text>
        <Text style={[Typography.h2, { color: Colors.uberGreenDark, marginTop: Spacing.sm }]}>
          Order #{placedOrderNumber}
        </Text>
        <Text style={[Typography.bodyMedium, styles.successSubtitle]}>
          Your order is being handcrafted with precision. Follow live brewing status on your Orders tab.
        </Text>
        <CafeButton
          title="Track Live Order"
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
          <Ionicons name="cart-outline" size={48} color={Colors.uberGreen} />
        </View>
        <Text style={[Typography.editorialMedium, { marginTop: Spacing.base, color: Colors.textPrimary }]}>
          Your Basket is Empty
        </Text>
        <Text style={[Typography.bodyMedium, { color: Colors.textMuted, marginTop: Spacing.xs, textAlign: 'center', maxWidth: 260 }]}>
          Explore specialty pour-overs, cold brews, and fresh artisan pastries
        </Text>
        <CafeButton
          title="Browse Menu"
          onPress={() => router.replace('/(tabs)/menu')}
          style={{ marginTop: Spacing.xl, minWidth: 200 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* Top Header with Close & Clear Actions */}
      <View style={styles.topHeaderBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[Typography.h3, { color: Colors.textPrimary }]}>Your Basket</Text>
        <TouchableOpacity onPress={handleClearCartPrompt} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Fulfillment Mode Segmented Toggle (Improvement 37) */}
        <View style={styles.fulfillmentToggleContainer}>
          <TouchableOpacity
            style={[
              styles.fulfillmentTab,
              fulfillmentMode === 'DINE_IN' && styles.fulfillmentTabActive,
            ]}
            onPress={() => {
              setFulfillmentMode('DINE_IN');
              hapticFeedback.selection();
            }}
          >
            <Ionicons
              name="restaurant-outline"
              size={16}
              color={fulfillmentMode === 'DINE_IN' ? '#FFFFFF' : Colors.textSecondary}
            />
            <Text
              style={[
                styles.fulfillmentTabText,
                fulfillmentMode === 'DINE_IN' && styles.fulfillmentTabTextActive,
              ]}
            >
              Dine-In • Table {tableNumber || 1}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.fulfillmentTab,
              fulfillmentMode === 'TAKEAWAY' && styles.fulfillmentTabActive,
            ]}
            onPress={() => {
              setFulfillmentMode('TAKEAWAY');
              hapticFeedback.selection();
            }}
          >
            <Ionicons
              name="bag-handle-outline"
              size={16}
              color={fulfillmentMode === 'TAKEAWAY' ? '#FFFFFF' : Colors.textSecondary}
            />
            <Text
              style={[
                styles.fulfillmentTabText,
                fulfillmentMode === 'TAKEAWAY' && styles.fulfillmentTabTextActive,
              ]}
            >
              Takeaway / Counter
            </Text>
          </TouchableOpacity>
        </View>

        {/* Items List */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            Selected Items ({items.reduce((s, i) => s + i.quantity, 0)})
          </Text>
          {items.map((item) => {
            const img = item.imageUrl || MediaAssets.fallbackByKeyword(item.name);
            return (
              <View key={item.menuItemId} style={styles.cartItemRow}>
                <CafeAsyncImage
                  source={{ uri: img }}
                  style={styles.itemThumb}
                  borderRadius={Radius.md}
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

        {/* Cross-Sell Upsell Drawer (Improvement 35) */}
        <View style={styles.upsellSection}>
          <Text style={styles.upsellSectionTitle}>Frequently Paired Delights</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.upsellScroll}>
            {UPSELL_ITEMS.map((upsell) => (
              <View key={upsell.id} style={styles.upsellCard}>
                <CafeAsyncImage
                  source={{ uri: upsell.image }}
                  style={styles.upsellImage}
                  borderRadius={Radius.md}
                  contentFit="cover"
                />
                <Text style={styles.upsellName} numberOfLines={1}>{upsell.name}</Text>
                <Text style={styles.upsellPrice}>{formatPaise(upsell.pricePaise)}</Text>
                <TouchableOpacity
                  style={styles.upsellAddBtn}
                  onPress={() => handleAddUpsell(upsell)}
                >
                  <Ionicons name="add" size={14} color={Colors.uberGreen} />
                  <Text style={styles.upsellAddText}>Add</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* One-Tap Tip Selector (Improvement 33) */}
        <CafeCard variant="elevated" style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Ionicons name="heart" size={18} color="#E11900" />
            <Text style={[styles.tipTitle, { marginLeft: 6 }]}>Show Barista Appreciation</Text>
          </View>
          <Text style={styles.tipSubtitle}>100% of tips go directly to the team behind the counter</Text>
          <View style={styles.tipOptionsRow}>
            {TIP_OPTIONS.map((tip) => {
              const active = selectedTipPaise === tip.amountPaise;
              return (
                <TouchableOpacity
                  key={tip.amountPaise}
                  style={[styles.tipChip, active && styles.tipChipActive]}
                  onPress={() => {
                    setSelectedTipPaise(tip.amountPaise);
                    hapticFeedback.tap();
                  }}
                >
                  <Text style={[styles.tipChipText, active && styles.tipChipTextActive]}>
                    {tip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </CafeCard>

        {/* Promo Voucher Card with Checkmark (Improvement 36) */}
        <CafeCard variant="elevated" style={styles.promoCard}>
          <Text style={[Typography.labelMedium, { marginBottom: Spacing.sm, color: Colors.textSecondary }]}>
            Apply Voucher or Promo Code
          </Text>
          {appliedOffer ? (
            <View style={styles.appliedPromoRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.uberGreen} />
                <View>
                  <Text style={[Typography.labelLarge, { color: Colors.uberGreenDark }]}>
                    {appliedOffer.code} Applied!
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

        {/* Perforated Receipt Styling (Improvement 32) */}
        <View style={styles.receiptContainer}>
          <View style={styles.receiptInner}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptTitle}>RECEIPT BREAKDOWN</Text>
              <Text style={styles.receiptId}>GST Reg: 29AAAAA0000A1Z5</Text>
            </View>

            <View style={styles.receiptDivider} />

            <View style={styles.billRow}>
              <Text style={styles.receiptLabel}>Item Subtotal</Text>
              <Text style={styles.receiptValue}>{formatPaise(subtotal)}</Text>
            </View>

            {discount > 0 ? (
              <View style={styles.billRow}>
                <Text style={[styles.receiptLabel, { color: Colors.uberGreenDark }]}>Coupon Discount</Text>
                <Text style={[styles.receiptValue, { color: Colors.uberGreenDark, fontWeight: '700' }]}>
                  -{formatPaise(discount)}
                </Text>
              </View>
            ) : null}

            <View style={styles.billRow}>
              <Text style={styles.receiptLabel}>Restaurant GST (5%)</Text>
              <Text style={styles.receiptValue}>{formatPaise(gst)}</Text>
            </View>

            {selectedTipPaise > 0 ? (
              <View style={styles.billRow}>
                <Text style={styles.receiptLabel}>Barista Tip</Text>
                <Text style={styles.receiptValue}>{formatPaise(selectedTipPaise)}</Text>
              </View>
            ) : null}

            <View style={styles.receiptDividerThick} />

            <View style={[styles.billRow, { marginTop: 6 }]}>
              <Text style={styles.receiptTotalLabel}>Grand Total</Text>
              <Text style={styles.receiptTotalValue}>{formatPaise(grandTotal)}</Text>
            </View>
          </View>

          {/* Serrated Cutout Edge at bottom */}
          <View style={styles.serratedRow}>
            {Array.from({ length: 18 }).map((_, i) => (
              <View key={i} style={styles.serratedTooth} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Checkout Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + Spacing.xs }]}>
        <View style={styles.footerSummary}>
          <Text style={styles.footerItemCount}>{items.reduce((s, i) => s + i.quantity, 0)} Items • {fulfillmentMode}</Text>
          <Text style={styles.footerTotal}>{formatPaise(grandTotal)}</Text>
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
    backgroundColor: '#F6F6F6',
  },
  topHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearBtnText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 120,
  },
  fulfillmentToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EBEBEB',
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.base,
  },
  fulfillmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.full,
    gap: 6,
  },
  fulfillmentTabActive: {
    backgroundColor: Colors.uberBlack,
  },
  fulfillmentTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  fulfillmentTabTextActive: {
    color: '#FFFFFF',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Elevation.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: '#F0F0F0',
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
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  cartItemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 3,
  },
  upsellSection: {
    marginBottom: Spacing.base,
  },
  upsellSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  upsellScroll: {
    gap: 12,
  },
  upsellCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: 8,
    ...Elevation.sm,
  },
  upsellImage: {
    width: '100%',
    height: 80,
    borderRadius: Radius.xs,
    backgroundColor: '#F0F0F0',
  },
  upsellName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 6,
  },
  upsellPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.uberGreenDark,
    marginTop: 2,
  },
  upsellAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F8F0',
    borderRadius: Radius.xs,
    paddingVertical: 4,
    marginTop: 6,
  },
  upsellAddText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.uberGreenDark,
    marginLeft: 2,
  },
  tipCard: {
    marginBottom: Spacing.base,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tipSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  tipOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  tipChipActive: {
    backgroundColor: Colors.uberBlack,
    borderColor: Colors.uberBlack,
  },
  tipChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tipChipTextActive: {
    color: '#FFFFFF',
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
    backgroundColor: '#F6F6F6',
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
    backgroundColor: '#E8F8F0',
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
  receiptContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Elevation.sm,
  },
  receiptInner: {
    padding: Spacing.base,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  receiptId: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  receiptDivider: {
    borderStyle: 'dashed',
    borderWidth: 0.8,
    borderColor: '#CCCCCC',
    marginVertical: 10,
  },
  receiptDividerThick: {
    borderWidth: 1,
    borderColor: '#000000',
    marginVertical: 10,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  receiptLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  receiptTotalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  receiptTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.uberGreenDark,
  },
  serratedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 2,
    marginBottom: -4,
  },
  serratedTooth: {
    width: 14,
    height: 8,
    backgroundColor: '#F6F6F6',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
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
    color: Colors.textPrimary,
  },
  placeOrderBtn: {
    flex: 1.2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: '#FFFFFF',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: '#FFFFFF',
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.uberGreen,
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
