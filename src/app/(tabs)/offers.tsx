import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useCartStore } from '@/stores/cartStore';
import { CafeAsyncImage } from '@/components/common/CafeAsyncImage';
import { FloatingCartBar } from '@/components/specific/FloatingCartBar';
import { Radius } from '@/constants/dimens';
import { formatPaise } from '@/utils/currency';
import { ApiResponse } from '@/types/auth';
import { MediaAssets } from '@/constants/media';

// Android MD3 + Kyoto Minimalist Color Tokens
const KyotoMD3 = {
  surface: '#F8F5F0',
  surfaceContainer: '#F1ECE1',
  surfaceContainerHigh: '#EAE3D5',
  surfaceBright: '#FFFFFF',
  onSurface: '#1D1B16',
  onSurfaceVariant: '#5A554E',
  outline: '#8E8B85',
  outlineSubtle: 'rgba(0, 0, 0, 0.06)',
  primary: '#1C3B22',
  primaryContainer: '#CFE9D2',
  onPrimary: '#FFFFFF',
  secondary: '#855325',
  secondaryContainer: '#F6E5D4',
  ratingStar: '#E5A93C',
};

// Rich Imagery Mapping for Roastery Perks
const PERK_MEDIA = [
  MediaAssets.heroes.pourOver,
  MediaAssets.heroes.bakeryDisplay,
  MediaAssets.heroes.coldBrew,
  MediaAssets.heroes.latteArt,
];

export default function OffersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    appliedOffer,
    applyOffer,
    removeOffer,
    getSubtotalPaise,
    getTotalItems,
    getTotalPaise,
    tableNumber,
  } = useCartStore();

  const { data: offers, isLoading, refetch } = useQuery({
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
    Alert.alert('Perk Applied 🎉', `Voucher ${offer.code} successfully added to your order.`);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header Bar */}
      <View style={[styles.topAppBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 4) }]}>
        <View style={styles.headerTitleCol}>
          <View style={styles.tableChip}>
            <View style={styles.tableDot} />
            <Text style={styles.tableChipText}>Kyoto Member Rewards</Text>
          </View>
          <Text style={styles.brandTitleText}>Exclusive Vouchers</Text>
        </View>

        <Pressable
          style={styles.iconButtonMD3}
          android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true }}
          onPress={() => refetch()}
        >
          <Ionicons name="refresh-outline" size={18} color={KyotoMD3.onSurface} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitleIntro}>
          Redeem artisanal member perks to save on single-origin pour-overs, cold steeps, and warm viennoiseries.
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={KyotoMD3.primary} />
          </View>
        ) : !offers || offers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={48} color={KyotoMD3.outline} />
            <Text style={styles.emptyHeading}>No vouchers available right now</Text>
            <Text style={styles.emptySub}>Check back soon for fresh seasonal roastery perks.</Text>
          </View>
        ) : (
          offers.map((offer, index) => {
            const isApplied = appliedOffer?.code === offer.code;
            const heroImage = PERK_MEDIA[index % PERK_MEDIA.length];

            return (
              <View key={offer.id} style={styles.ticketCard}>
                {/* 4K Visual Banner */}
                <View style={styles.ticketMediaWrap}>
                  <CafeAsyncImage
                    source={{ uri: heroImage }}
                    style={styles.ticketMedia}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.discountTagBadge}>
                    <Text style={styles.discountTagText}>
                      {offer.discountType === 'PERCENTAGE'
                        ? `${offer.discountValue}% OFF`
                        : `₹${offer.discountValue / 100} OFF`}
                    </Text>
                  </View>
                </View>

                {/* Perforated Concave Cuts */}
                <View style={[styles.perforationCircle, styles.circleLeft]} />
                <View style={[styles.perforationCircle, styles.circleRight]} />

                {/* Ticket Details Body */}
                <View style={styles.ticketBody}>
                  <View style={styles.ticketHeaderRow}>
                    <View style={styles.codeCapsule}>
                      <Ionicons name="pricetag" size={11} color={KyotoMD3.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.codeCapsuleText}>{offer.code}</Text>
                    </View>
                    <Text style={styles.microTerms}>
                      Min: {formatPaise(offer.minOrderAmountPaise)}
                    </Text>
                  </View>

                  <Text style={styles.offerTitle}>{offer.title}</Text>
                  {offer.description ? (
                    <Text style={styles.offerDesc} numberOfLines={2}>
                      {offer.description}
                    </Text>
                  ) : null}

                  {/* Dashed Perforation Line */}
                  <View style={styles.dashedLine} />

                  <View style={styles.ticketFooterRow}>
                    <View style={styles.secureBadge}>
                      <Ionicons name="checkmark-circle-outline" size={13} color={KyotoMD3.primary} />
                      <Text style={styles.secureBadgeText}>Authentic Perk</Text>
                    </View>

                    {isApplied ? (
                      <TouchableOpacity
                        style={styles.appliedButton}
                        onPress={() => {
                          Haptics.selectionAsync();
                          removeOffer();
                        }}
                      >
                        <Ionicons name="checkmark" size={14} color={KyotoMD3.primary} />
                        <Text style={styles.appliedButtonText}>Applied (Remove)</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.applyButton}
                        onPress={() => handleApplyCoupon(offer)}
                      >
                        <Text style={styles.applyButtonText}>Apply Code</Text>
                        <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
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
    backgroundColor: KyotoMD3.surface,
  },
  topAppBar: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: KyotoMD3.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: KyotoMD3.outlineSubtle,
  },
  headerTitleCol: {
    flexDirection: 'column',
  },
  tableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: KyotoMD3.primaryContainer,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  tableDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: KyotoMD3.primary,
  },
  tableChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: KyotoMD3.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  brandTitleText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: KyotoMD3.onSurface,
  },
  iconButtonMD3: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: KyotoMD3.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { elevation: 1 },
    }),
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  subtitleIntro: {
    fontSize: 12,
    color: KyotoMD3.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 2,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: KyotoMD3.onSurface,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: KyotoMD3.onSurfaceVariant,
    marginTop: 4,
  },
  ticketCard: {
    backgroundColor: KyotoMD3.surfaceBright,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
    }),
  },
  ticketMediaWrap: {
    width: '100%',
    height: 120,
    position: 'relative',
    backgroundColor: KyotoMD3.surfaceContainer,
  },
  ticketMedia: {
    width: '100%',
    height: '100%',
  },
  discountTagBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(29, 27, 22, 0.88)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
  },
  discountTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  perforationCircle: {
    position: 'absolute',
    top: 112,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: KyotoMD3.surface,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    zIndex: 10,
  },
  circleLeft: {
    left: -8,
  },
  circleRight: {
    right: -8,
  },
  ticketBody: {
    padding: 16,
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KyotoMD3.primaryContainer,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
  },
  codeCapsuleText: {
    fontSize: 11,
    fontWeight: '800',
    color: KyotoMD3.primary,
    letterSpacing: 0.8,
  },
  microTerms: {
    fontSize: 10,
    fontWeight: '600',
    color: KyotoMD3.secondary,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  offerDesc: {
    fontSize: 11,
    color: KyotoMD3.onSurfaceVariant,
    lineHeight: 16,
    marginBottom: 12,
  },
  dashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  ticketFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secureBadgeText: {
    fontSize: 11,
    color: KyotoMD3.onSurfaceVariant,
    fontWeight: '600',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: KyotoMD3.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
  },
  applyButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  appliedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: KyotoMD3.primaryContainer,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
  },
  appliedButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: KyotoMD3.primary,
  },
});
