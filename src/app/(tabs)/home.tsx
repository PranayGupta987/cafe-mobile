import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useCartStore } from '@/stores/cartStore';
import { CafeCard } from '@/components/common/Card';
import { QuantityStepper } from '@/components/specific/QuantityStepper';
import { VegIndicator } from '@/components/specific/VegIndicator';
import { FloatingCartBar } from '@/components/specific/FloatingCartBar';
import { AnimatedSearchTicker } from '@/components/specific/AnimatedSearchTicker';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Elevation } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { formatPaise } from '@/utils/currency';
import { ApiResponse } from '@/types/auth';
import { MediaAssets } from '@/constants/media';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOOD_FILTERS = [
  { id: 'all', label: '☕ All Day Brews' },
  { id: 'pour-over', label: '✨ Reserve Pour-Over' },
  { id: 'bakery', label: '🥐 Warm Pastries' },
  { id: 'cold-brew', label: '🧊 Nitro Cold Brew' },
  { id: 'matcha', label: '🍵 Ceremonial Matcha' },
];

export default function HomeScreen() {
  const router = useRouter();
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
  const [activeMood, setActiveMood] = useState('all');

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
      return (res.data.data || []).slice(0, 8);
    },
  });

  const getItemQuantity = (id: string) => {
    return cartItems.find((i) => i.menuItemId === id)?.quantity || 0;
  };

  const handleOpenDetail = (item: any) => {
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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Story Circles / Highlights (Pinterest / Instagram Style) */}
        <View style={styles.storiesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesScroll}
          >
            {MediaAssets.stories.map((story) => (
              <TouchableOpacity
                key={story.id}
                style={styles.storyItem}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/menu')}
              >
                <View style={styles.storyRing}>
                  <Image
                    source={{ uri: story.image }}
                    style={styles.storyAvatar}
                    contentFit="cover"
                    transition={200}
                  />
                </View>
                <Text style={styles.storyTitle} numberOfLines={1}>
                  {story.title}
                </Text>
                <Text style={styles.storyTag}>{story.tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Search Bar Ticker Shortcut */}
        <TouchableOpacity
          style={styles.searchShortcutBar}
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/menu')}
        >
          <Ionicons name="search" size={20} color={Colors.uberGreen} style={{ marginRight: 10 }} />
          <Text style={styles.searchShortcutText}>Search 'Cold Brew', 'Matcha', 'Pastries'...</Text>
          <View style={styles.searchShortcutBadge}>
            <Ionicons name="options-outline" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Hero Banner Bento Card */}
        <View style={styles.heroWrapper}>
          <Image
            source={{ uri: MediaAssets.heroes.pourOver }}
            style={styles.heroBackground}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['rgba(26,15,10,0.1)', 'rgba(26,15,10,0.65)', 'rgba(26,15,10,0.92)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.artisanBadge}>
                <Ionicons name="sparkles" size={12} color={Colors.cafeGold} />
                <Text style={styles.artisanBadgeText}>ARTISAN ROASTERY</Text>
              </View>
              {cafeProfile?.name ? (
                <Text style={styles.cafeNameText}>{cafeProfile.name}</Text>
              ) : null}
            </View>

            <Text style={styles.heroHeadline}>Experience Specialty Brews</Text>
            <Text style={styles.heroSubhead}>
              Single-origin beans, craft pour-overs, and warm European bakes made fresh hourly.
            </Text>

            {/* Glassmorphic Table Check-In Capsule */}
            <View style={styles.tableCapsule}>
              <View style={styles.tableCapsuleLeft}>
                <Ionicons
                  name={tableNumber ? 'restaurant' : 'qr-code-outline'}
                  size={20}
                  color={Colors.caramel}
                />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.tableCapsuleTitle}>
                    {tableNumber ? `Dine-In • Table ${tableNumber}` : 'Dine-In Check-In'}
                  </Text>
                  <Text style={styles.tableCapsuleSubtitle}>
                    {tableNumber
                      ? 'Orders served directly to your seat'
                      : 'Scan table code for contactless service'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.tableCapsuleBtn}
                onPress={() => router.push('/modal/qr-scanner')}
              >
                <Text style={styles.tableCapsuleBtnText}>
                  {tableNumber ? 'Change' : 'Scan'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Action Navigation Grid */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/modal/reservations')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#F5EBE6' }]}>
              <Ionicons name="calendar" size={22} color={Colors.cafeBrown} />
            </View>
            <Text style={styles.actionCardTitle}>Reserve Table</Text>
            <Text style={styles.actionCardSub}>Instant confirmation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/menu')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#E9F5E8' }]}>
              <Ionicons name="restaurant" size={22} color={Colors.matcha} />
            </View>
            <Text style={styles.actionCardTitle}>Curated Menu</Text>
            <Text style={styles.actionCardSub}>30+ Specialty items</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/offers')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FFF5E5' }]}>
              <Ionicons name="pricetag" size={22} color={Colors.warning} />
            </View>
            <Text style={styles.actionCardTitle}>Exclusive Deals</Text>
            <Text style={styles.actionCardSub}>Save up to 25%</Text>
          </TouchableOpacity>
        </View>

        {/* Mood Filter Chips */}
        <View style={styles.moodSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodScroll}
          >
            {MOOD_FILTERS.map((mood) => {
              const active = activeMood === mood.id;
              return (
                <TouchableOpacity
                  key={mood.id}
                  style={[styles.moodChip, active && styles.moodChipActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveMood(mood.id);
                  }}
                >
                  <Text style={[styles.moodChipText, active && styles.moodChipTextActive]}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Special Offers Carousel */}
        {offersData && offersData.length > 0 ? (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Limited Offers</Text>
                <Text style={styles.sectionSubtitle}>Handcrafted perks for your table</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/offers')}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.offersScroll}
            >
              {offersData.map((offer) => (
                <TouchableOpacity
                  key={offer.id}
                  style={styles.offerCard}
                  activeOpacity={0.9}
                  onPress={() => router.push('/(tabs)/offers')}
                >
                  <LinearGradient
                    colors={[Colors.cafeBrownDark, Colors.cafeBrown]}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.offerCardHeader}>
                    <View style={styles.offerDiscountBadge}>
                      <Text style={styles.offerDiscountText}>
                        {offer.discountType === 'PERCENTAGE'
                          ? `${offer.discountValue}% OFF`
                          : `₹${offer.discountValue / 100} OFF`}
                      </Text>
                    </View>
                    <Ionicons name="sparkles" size={16} color={Colors.caramel} />
                  </View>
                  <Text style={styles.offerCardTitle} numberOfLines={1}>
                    {offer.title}
                  </Text>
                  <View style={styles.offerCodePill}>
                    <Text style={styles.offerCodeText}>CODE: {offer.code}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Chef's Curated Specials with Media Cards */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Chef&apos;s Signature Picks</Text>
              <Text style={styles.sectionSubtitle}>Pairings recommended by our baristas</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/menu')}>
              <Text style={styles.seeAllText}>Full Menu</Text>
            </TouchableOpacity>
          </View>

          {itemsLoading ? (
            <ActivityIndicator size="small" color={Colors.cafeBrown} style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.specialsList}>
              {menuItemsData?.map((item) => {
                const qty = getItemQuantity(item.id);
                const imageUrl = item.imageUrl || MediaAssets.fallbackByKeyword(item.name);

                return (
                  <CafeCard key={item.id} variant="elevated" style={styles.mediaItemCard}>
                    <TouchableOpacity
                      activeOpacity={0.95}
                      onPress={() => handleOpenDetail(item)}
                      style={styles.cardTouchWrapper}
                    >
                      {/* Left: Food Photography */}
                      <View style={styles.imageBox}>
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.itemImage}
                          contentFit="cover"
                          transition={250}
                        />
                        <View style={styles.vegIndicatorFloating}>
                          <VegIndicator isVeg={item.isVeg} size={12} />
                        </View>
                      </View>

                      {/* Right: Item Metadata & Stepper */}
                      <View style={styles.itemContent}>
                        <View style={styles.itemMetaTop}>
                          {item.isSpicy ? (
                            <View style={styles.miniSpicyPill}>
                              <Ionicons name="flame" size={11} color={Colors.error} />
                              <Text style={styles.miniPillText}>Spicy</Text>
                            </View>
                          ) : (
                            <View style={styles.miniBrewPill}>
                              <Ionicons name="time-outline" size={11} color={Colors.cafeBrown} />
                              <Text style={styles.miniPillText}>Fresh Brew</Text>
                            </View>
                          )}
                          <Text style={styles.ratingText}>★ 4.9</Text>
                        </View>

                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemDescription} numberOfLines={2}>
                          {item.description}
                        </Text>

                        <View style={styles.priceStepperRow}>
                          <Text style={styles.itemPrice}>
                            {formatPaise(item.pricePaise)}
                          </Text>

                          <View style={styles.stepperContainer}>
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
                        </View>
                      </View>
                    </TouchableOpacity>
                  </CafeCard>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Cart Bar (Above TabBar) */}
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 130,
  },
  storiesContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  storiesScroll: {
    paddingHorizontal: Spacing.base,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  storyRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2.5,
    borderWidth: 2,
    borderColor: Colors.uberGreen,
    backgroundColor: Colors.surface,
  },
  searchShortcutBar: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Elevation.sm,
  },
  searchShortcutText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  searchShortcutBadge: {
    backgroundColor: Colors.uberGreen,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  storyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
    textAlign: 'center',
  },
  storyTag: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  heroWrapper: {
    margin: Spacing.base,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    height: 250,
    position: 'relative',
    ...Elevation.md,
  },
  heroBackground: {
    width: '100%',
    height: '100%',
  },
  heroContent: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    justifyContent: 'flex-end',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  artisanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  artisanBadgeText: {
    color: Colors.caramel,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cafeNameText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.8,
  },
  heroHeadline: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  heroSubhead: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  tableCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(26,15,10,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: Spacing.md,
  },
  tableCapsuleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tableCapsuleTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tableCapsuleSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  tableCapsuleBtn: {
    backgroundColor: Colors.caramel,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  tableCapsuleBtnText: {
    color: Colors.espressoDark,
    fontSize: 11,
    fontWeight: '800',
  },
  actionGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    ...Elevation.sm,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  actionCardSub: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 1,
  },
  moodSection: {
    marginTop: Spacing.lg,
  },
  moodScroll: {
    paddingHorizontal: Spacing.base,
    gap: 8,
  },
  moodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moodChipActive: {
    backgroundColor: Colors.cafeBrown,
    borderColor: Colors.cafeBrown,
  },
  moodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  moodChipTextActive: {
    color: '#FFFFFF',
  },
  sectionContainer: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.cafeBrown,
  },
  offersScroll: {
    gap: 12,
    paddingBottom: 4,
  },
  offerCard: {
    width: 200,
    height: 110,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    ...Elevation.md,
  },
  offerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerDiscountBadge: {
    backgroundColor: Colors.caramel,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  offerDiscountText: {
    color: Colors.espressoDark,
    fontSize: 11,
    fontWeight: '800',
  },
  offerCardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  offerCodePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  offerCodeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  specialsList: {
    gap: 12,
  },
  mediaItemCard: {
    backgroundColor: Colors.surface,
    padding: 0,
    overflow: 'hidden',
    borderRadius: Radius.lg,
  },
  cardTouchWrapper: {
    flexDirection: 'row',
    padding: Spacing.md,
  },
  imageBox: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  vegIndicatorFloating: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: 3,
    borderRadius: 4,
  },
  itemContent: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'space-between',
  },
  itemMetaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniBrewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  miniSpicyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  miniPillText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  ratingText: {
    fontSize: 11,
    color: Colors.cafeGoldDark,
    fontWeight: '700',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  priceStepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.cafeBrown,
  },
  stepperContainer: {
    alignItems: 'flex-end',
  },
});
