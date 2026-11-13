import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useCartStore } from '@/stores/cartStore';
import { CafeAsyncImage } from '@/components/common/CafeAsyncImage';
import { QuantityStepper } from '@/components/specific/QuantityStepper';
import { VegIndicator } from '@/components/specific/VegIndicator';
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
  gold: '#D4AF37',
  ratingStar: '#E5A93C',
};

const CATEGORY_CHIPS = [
  { id: 'all', label: 'All Day Brews', icon: 'cafe-outline' as const },
  { id: 'pour-over', label: 'Reserve Pour-Over', icon: 'water-outline' as const },
  { id: 'bakery', label: 'Warm Bakery', icon: 'basket-outline' as const },
  { id: 'cold-brew', label: 'Nitro Cold Brew', icon: 'snow-outline' as const },
  { id: 'matcha', label: 'Uji Matcha', icon: 'leaf-outline' as const },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    items: cartItems,
    addItem,
    decrementItem,
    getTotalItems,
    getTotalPaise,
    tableNumber,
  } = useCartStore();

  const totalItems = getTotalItems();
  const totalPaise = getTotalPaise();
  const [activeCategory, setActiveCategory] = useState('all');

  // Fetch active cafe profile
  const { data: cafeProfile } = useQuery({
    queryKey: ['cafe-profile'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any>>('/cafe');
      return res.data.data;
    },
  });

  // Fetch active offers
  const { data: offersData } = useQuery({
    queryKey: ['active-offers'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any[]>>('/offers');
      return res.data.data || [];
    },
  });

  // Fetch featured menu items
  const { data: menuItemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['featured-menu-items'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any[]>>('/menu/items');
      return (res.data.data || []).slice(0, 10);
    },
  });

  const featuredOffer = offersData?.[0];

  const getItemQuantity = (id: string) => {
    return cartItems.find((i) => i.menuItemId === id)?.quantity || 0;
  };

  const handleOpenDetail = (item: any) => {
    Haptics.selectionAsync();
    router.push({
      pathname: '/modal/item-detail',
      params: {
        id: item.id,
        name: item.name,
        pricePaise: item.pricePaise.toString(),
        description: item.description,
        imageUrl: item.imageUrl || MediaAssets.fallbackByKeyword(item.name),
        isVeg: item.isVeg ? 'true' : 'false',
        isSpicy: item.isSpicy ? 'true' : 'false',
        categoryName: item.category?.name || 'Chef Special',
      },
    });
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar style="dark" />

      {/* Android Top App Bar */}
      <View style={[styles.topAppBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 4) }]}>
        <View style={styles.headerLeftCol}>
          <Pressable
            style={styles.tableChip}
            android_ripple={{ color: 'rgba(28, 59, 34, 0.12)' }}
            onPress={() => router.push('/modal/qr-scanner')}
          >
            <View style={styles.tablePulseDot} />
            <Text style={styles.tableChipText}>
              {tableNumber ? `Dine-In • Table ${tableNumber}` : 'Dine-In • Scan Table QR'}
            </Text>
            <Ionicons name="chevron-forward" size={12} color={KyotoMD3.primary} />
          </Pressable>
          <Text style={styles.brandTitleText}>
            {cafeProfile?.name || 'Artisan Roastery'}
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <Pressable
            style={styles.iconButtonMD3}
            android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true }}
            onPress={() => router.push('/modal/qr-scanner')}
          >
            <Ionicons name="qr-code-outline" size={19} color={KyotoMD3.onSurface} />
          </Pressable>
          <Pressable
            style={styles.iconButtonMD3}
            android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true }}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <Ionicons name="receipt-outline" size={19} color={KyotoMD3.onSurface} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Story Circles Rail */}
        <View style={styles.storiesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesScroll}
          >
            {MediaAssets.stories.map((story) => (
              <Pressable
                key={story.id}
                style={styles.storyBubble}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(tabs)/menu');
                }}
              >
                <View style={styles.storyAvatarRing}>
                  <CafeAsyncImage
                    source={{ uri: story.image }}
                    style={styles.storyAvatar}
                    borderRadius={Radius.full}
                    contentFit="cover"
                    transition={200}
                  />
                </View>
                <Text style={styles.storyLabel} numberOfLines={1}>
                  {story.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* MD3 Category Pill Carousel */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {CATEGORY_CHIPS.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveCategory(cat.id);
                  }}
                >
                  <Ionicons
                    name={cat.icon}
                    size={14}
                    color={isActive ? KyotoMD3.onPrimary : KyotoMD3.onSurfaceVariant}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Full-Bleed Cinematic Hero Card */}
        <Pressable
          style={styles.heroCard}
          android_ripple={{ color: 'rgba(0,0,0,0.04)' }}
          onPress={() => router.push('/(tabs)/menu')}
        >
          <View style={styles.heroMediaContainer}>
            <CafeAsyncImage
              source={{ uri: MediaAssets.heroes.pourOver }}
              style={styles.heroMediaImage}
              borderRadius={Radius.xl}
              contentFit="cover"
              transition={300}
            />
            {/* Origin & Prep Floating Badges */}
            <View style={styles.heroBadgeTopLeft}>
              <Text style={styles.heroBadgeText}>ORIGIN LOT 42 • RESERVE</Text>
            </View>
            <View style={styles.heroRatingBadge}>
              <Ionicons name="star" size={11} color={KyotoMD3.ratingStar} />
              <Text style={styles.heroRatingText}>4.98</Text>
            </View>
          </View>

          <View style={styles.heroContentArea}>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroItemTitle}>Geisha Panama V60</Text>
              <Text style={styles.heroItemPrice}>₹380</Text>
            </View>
            <Text style={styles.heroDescription}>
              Hand-harvested Boquete micro-lot. Notes of white jasmine florals, Meyer lemon sweetness, and delicate bergamot finish.
            </Text>
            <View style={styles.heroFooterRow}>
              <View style={styles.heroMetaPills}>
                <View style={styles.metaMicroPill}>
                  <Text style={styles.metaMicroPillText}>Single Origin</Text>
                </View>
                <View style={styles.metaMicroPill}>
                  <Text style={styles.metaMicroPillText}>12-15 min brew</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.heroCraftBtn}
                onPress={() => router.push('/(tabs)/menu')}
              >
                <Text style={styles.heroCraftBtnText}>Select &amp; Craft</Text>
                <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>

        {/* Minimalist Japanese Courtesy Voucher */}
        <View style={styles.voucherCard}>
          {/* Perforated edge cuts */}
          <View style={[styles.perforationHole, styles.holeLeft]} />
          <View style={[styles.perforationHole, styles.holeRight]} />

          <View style={styles.voucherLeft}>
            <Text style={styles.voucherEyebrow}>
              {tableNumber ? `TABLE ${tableNumber} COURTESY` : 'DINE-IN COURTESY'}
            </Text>
            <Text style={styles.voucherHeading}>
              {featuredOffer?.title || 'Complimentary Almond Viennoiserie'}
            </Text>
            <Text style={styles.voucherCode}>
              {`PROMO CODE: ${featuredOffer?.code || 'KYOTO25'}`}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.voucherApplyBtn}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
          >
            <Text style={styles.voucherApplyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>

        {/* Section Heading: Signature Creations */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeadingTitle}>Signature Creations</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/menu')}>
            <Text style={styles.sectionHeadingLink}>Explore All →</Text>
          </TouchableOpacity>
        </View>

        {/* Cinematic Visual-Heavy Feed */}
        {itemsLoading ? (
          <ActivityIndicator size="small" color={KyotoMD3.primary} style={{ marginTop: 30 }} />
        ) : (
          <View style={styles.cinematicFeedList}>
            {menuItemsData?.map((item) => {
              const qty = getItemQuantity(item.id);
              const imageUrl = item.imageUrl || MediaAssets.fallbackByKeyword(item.name);

              return (
                <Pressable
                  key={item.id}
                  style={styles.cinematicItemCard}
                  android_ripple={{ color: 'rgba(0,0,0,0.03)' }}
                  onPress={() => handleOpenDetail(item)}
                >
                  <View style={styles.cinematicMediaWrap}>
                    <CafeAsyncImage
                      source={{ uri: imageUrl }}
                      style={styles.cinematicItemImage}
                      borderRadius={Radius.lg}
                      contentFit="cover"
                      transition={250}
                    />
                    <View style={styles.cinematicVegBadge}>
                      <VegIndicator isVeg={item.isVeg} size={13} />
                    </View>
                    <View style={styles.cinematicRatingBadge}>
                      <Ionicons name="star" size={10} color={KyotoMD3.ratingStar} />
                      <Text style={styles.cinematicRatingText}>{item.rating || '4.9'}</Text>
                    </View>
                  </View>

                  <View style={styles.cinematicCardMeta}>
                    <View style={styles.cinematicMetaLeft}>
                      <Text style={styles.cinematicTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.cinematicDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>

                    <View style={styles.cinematicMetaRight}>
                      <Text style={styles.cinematicPrice}>
                        {formatPaise(item.pricePaise)}
                      </Text>

                      {qty === 0 ? (
                        <TouchableOpacity
                          style={styles.cinematicAddFab}
                          activeOpacity={0.8}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            addItem({
                              menuItemId: item.id,
                              name: item.name,
                              pricePaise: item.pricePaise,
                              imageUrl,
                              isVeg: item.isVeg,
                            });
                          }}
                        >
                          <Ionicons name="add" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.stepperWrap}>
                          <QuantityStepper
                            quantity={qty}
                            onIncrement={() =>
                              addItem({
                                menuItemId: item.id,
                                name: item.name,
                                pricePaise: item.pricePaise,
                                imageUrl,
                                isVeg: item.isVeg,
                              })
                            }
                            onDecrement={() => decrementItem(item.id)}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Cart Dock */}
      <FloatingCartBar
        totalItems={totalItems}
        totalPaise={totalPaise}
        tableNumber={tableNumber}
        onPress={() => router.push('/modal/cart')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: KyotoMD3.surface,
  },
  topAppBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: KyotoMD3.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: KyotoMD3.outlineSubtle,
    zIndex: 10,
  },
  headerLeftCol: {
    flexDirection: 'column',
  },
  tableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: KyotoMD3.primaryContainer,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  tablePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: KyotoMD3.primary,
  },
  tableChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: KyotoMD3.primary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  brandTitleText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: KyotoMD3.onSurface,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 8,
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
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
    }),
  },
  scrollContent: {
    paddingTop: 8,
  },
  storiesSection: {
    paddingVertical: 12,
  },
  storiesScroll: {
    paddingHorizontal: 20,
    gap: 14,
  },
  storyBubble: {
    alignItems: 'center',
    gap: 5,
  },
  storyAvatarRing: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    padding: 2,
    backgroundColor: KyotoMD3.surfaceContainerHigh,
    ...Platform.select({
      android: { elevation: 1 },
    }),
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
  },
  storyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: KyotoMD3.onSurfaceVariant,
    maxWidth: 64,
    textAlign: 'center',
  },
  categoriesSection: {
    paddingBottom: 14,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    backgroundColor: KyotoMD3.surfaceBright,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    ...Platform.select({
      android: { elevation: 1 },
    }),
  },
  categoryChipActive: {
    backgroundColor: KyotoMD3.primary,
    borderColor: KyotoMD3.primary,
    ...Platform.select({
      android: { elevation: 2 },
    }),
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: KyotoMD3.onSurfaceVariant,
  },
  categoryChipTextActive: {
    color: KyotoMD3.onPrimary,
    fontWeight: '700',
  },
  heroCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: Radius.xl,
    backgroundColor: KyotoMD3.surfaceBright,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    overflow: 'hidden',
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
    }),
  },
  heroMediaContainer: {
    width: '100%',
    height: 210,
    position: 'relative',
  },
  heroMediaImage: {
    width: '100%',
    height: '100%',
  },
  heroBadgeTopLeft: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: KyotoMD3.primary,
    letterSpacing: 0.8,
  },
  heroRatingBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(29, 27, 22, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  heroRatingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroContentArea: {
    padding: 18,
  },
  heroTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  heroItemTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
    letterSpacing: -0.5,
  },
  heroItemPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
  },
  heroDescription: {
    fontSize: 12,
    color: KyotoMD3.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: KyotoMD3.outlineSubtle,
  },
  heroMetaPills: {
    flexDirection: 'row',
    gap: 6,
  },
  metaMicroPill: {
    backgroundColor: KyotoMD3.surfaceContainer,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  metaMicroPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: KyotoMD3.onSurfaceVariant,
  },
  heroCraftBtn: {
    backgroundColor: KyotoMD3.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    ...Platform.select({
      android: { elevation: 1 },
    }),
  },
  heroCraftBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voucherCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: Radius.md,
    backgroundColor: KyotoMD3.surfaceBright,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      android: { elevation: 1 },
    }),
  },
  perforationHole: {
    position: 'absolute',
    top: '50%',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: KyotoMD3.surface,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
  },
  holeLeft: {
    left: -7,
    marginTop: -7,
  },
  holeRight: {
    right: -7,
    marginTop: -7,
  },
  voucherLeft: {
    flexDirection: 'column',
    gap: 2,
  },
  voucherEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: KyotoMD3.secondary,
    textTransform: 'uppercase',
  },
  voucherHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: KyotoMD3.onSurface,
  },
  voucherCode: {
    fontSize: 10,
    color: KyotoMD3.outline,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.5,
  },
  voucherApplyBtn: {
    backgroundColor: KyotoMD3.surfaceContainer,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
  },
  voucherApplyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: KyotoMD3.onSurface,
  },
  sectionHeaderRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionHeadingTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: KyotoMD3.onSurface,
  },
  sectionHeadingLink: {
    fontSize: 12,
    fontWeight: '700',
    color: KyotoMD3.primary,
  },
  cinematicFeedList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  cinematicItemCard: {
    backgroundColor: KyotoMD3.surfaceBright,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    overflow: 'hidden',
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
    }),
  },
  cinematicMediaWrap: {
    width: '100%',
    height: 170,
    position: 'relative',
  },
  cinematicItemImage: {
    width: '100%',
    height: '100%',
  },
  cinematicVegBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  cinematicRatingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(29, 27, 22, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: Radius.full,
  },
  cinematicRatingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cinematicCardMeta: {
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cinematicMetaLeft: {
    flex: 1,
    marginRight: 12,
  },
  cinematicTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: KyotoMD3.onSurface,
    marginBottom: 3,
  },
  cinematicDescription: {
    fontSize: 11,
    color: KyotoMD3.onSurfaceVariant,
    lineHeight: 16,
  },
  cinematicMetaRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  cinematicPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
  },
  cinematicAddFab: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: KyotoMD3.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { elevation: 1 },
    }),
  },
  stepperWrap: {
    marginTop: 2,
  },
});
