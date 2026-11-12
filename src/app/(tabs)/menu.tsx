import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
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
import { QuantityStepper } from '@/components/specific/QuantityStepper';
import { VegIndicator } from '@/components/specific/VegIndicator';
import { FloatingCartBar } from '@/components/specific/FloatingCartBar';
import { AnimatedSearchTicker } from '@/components/specific/AnimatedSearchTicker';
import { Shimmer } from '@/components/common/Shimmer';
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
  ratingStar: '#E5A93C',
};

export default function MenuScreen() {
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [vegOnly, setVegOnly] = useState(false);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any[]>>('/menu/categories');
      return res.data.data || [];
    },
  });

  // Fetch menu items
  const { data: itemsData, isLoading } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any[]>>('/menu/items');
      return res.data.data || [];
    },
  });

  const filteredItems = useMemo(() => {
    if (!itemsData) return [];
    return itemsData.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? item.categoryId === selectedCategory : true;
      const matchesVeg = vegOnly ? item.isVeg : true;
      return matchesSearch && matchesCategory && matchesVeg;
    });
  }, [itemsData, searchQuery, selectedCategory, vegOnly]);

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
        categoryName: item.category?.name || 'Artisan Special',
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top App Bar with Dine-In Table Status */}
      <View style={[styles.topAppBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 4) }]}>
        <View style={styles.headerTitleCol}>
          <View style={styles.tableChip}>
            <View style={styles.tableDot} />
            <Text style={styles.tableChipText}>
              {tableNumber ? `Dine-In • Table ${tableNumber}` : 'Dine-In • All-Day Roast'}
            </Text>
          </View>
          <Text style={styles.brandTitleText}>Artisan Menu</Text>
        </View>

        <View style={styles.headerRightActions}>
          <Pressable
            style={styles.iconButtonMD3}
            android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true }}
            onPress={() => router.push('/modal/qr-scanner')}
          >
            <Ionicons name="qr-code-outline" size={18} color={KyotoMD3.onSurface} />
          </Pressable>
        </View>
      </View>

      {/* Search & Veg Toggle Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <AnimatedSearchTicker
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Pressable
          style={[styles.vegFilterButton, vegOnly && styles.vegFilterButtonActive]}
          android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          onPress={() => {
            Haptics.selectionAsync();
            setVegOnly(!vegOnly);
          }}
        >
          <View style={[styles.vegIconBox, vegOnly && styles.vegIconBoxActive]}>
            <View style={[styles.vegDot, vegOnly && styles.vegDotActive]} />
          </View>
          <Text style={[styles.vegFilterLabel, vegOnly && styles.vegFilterLabelActive]}>
            Veg
          </Text>
        </Pressable>
      </View>

      {/* Category Pills Rail */}
      <View style={styles.categoryPillsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <Pressable
            style={[
              styles.categoryPill,
              selectedCategory === null && styles.categoryPillActive,
            ]}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedCategory(null);
            }}
          >
            <Ionicons
              name="cafe-outline"
              size={13}
              color={selectedCategory === null ? KyotoMD3.onPrimary : KyotoMD3.onSurfaceVariant}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === null && styles.categoryPillTextActive,
              ]}
            >
              All Items ({itemsData?.length || 0})
            </Text>
          </Pressable>

          {categoriesData?.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCategory(cat.id);
                }}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Menu Item Feed */}
      <ScrollView
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.shimmerList}>
            {[1, 2, 3, 4].map((key) => (
              <View key={key} style={styles.shimmerCard}>
                <Shimmer width={100} height={100} radius={Radius.lg} />
                <View style={{ flex: 1, gap: 8, marginLeft: 14 }}>
                  <Shimmer width={150} height={18} radius={Radius.sm} />
                  <Shimmer width="90%" height={12} radius={Radius.xs} />
                  <Shimmer width={70} height={16} radius={Radius.sm} />
                </View>
              </View>
            ))}
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cafe-outline" size={48} color={KyotoMD3.outline} />
            <Text style={styles.emptyHeading}>No artisan creations found</Text>
            <Text style={styles.emptySub}>Try searching for another brew or adjust your category filter.</Text>
          </View>
        ) : (
          filteredItems.map((item) => {
            const qty = getItemQuantity(item.id);
            const imageUrl = item.imageUrl || MediaAssets.fallbackByKeyword(item.name);
            const rating = (4.8 + ((item.name.length % 3) / 10)).toFixed(1);

            return (
              <Pressable
                key={item.id}
                style={styles.itemCard}
                android_ripple={{ color: 'rgba(0,0,0,0.03)' }}
                onPress={() => handleOpenDetail(item)}
              >
                {/* Food & Beverage Media Thumbnail */}
                <View style={styles.mediaWrap}>
                  <CafeAsyncImage
                    source={{ uri: imageUrl }}
                    style={styles.itemImage}
                    borderRadius={Radius.lg}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.vegBadgeWrap}>
                    <VegIndicator isVeg={item.isVeg} size={11} />
                  </View>
                </View>

                {/* Details Body */}
                <View style={styles.itemDetails}>
                  <View style={styles.metaRow}>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={10} color={KyotoMD3.ratingStar} />
                      <Text style={styles.ratingText}>{rating}</Text>
                    </View>
                    <Text style={styles.categoryMicroText}>
                      {item.category?.name || 'Artisan Special'}
                    </Text>
                  </View>

                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemDesc} numberOfLines={2}>
                    {item.description}
                  </Text>

                  {/* Price & Stepper CTA */}
                  <View style={styles.cardFooterRow}>
                    <Text style={styles.priceText}>
                      {formatPaise(item.pricePaise)}
                    </Text>

                    {qty === 0 ? (
                      <TouchableOpacity
                        style={styles.addFabButton}
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
                        <Ionicons name="add" size={17} color="#FFFFFF" />
                      </TouchableOpacity>
                    ) : (
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
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Floating Bottom Table Cart Bar */}
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
    zIndex: 10,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  searchInputWrap: {
    flex: 1,
  },
  vegFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: KyotoMD3.surfaceBright,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    ...Platform.select({
      android: { elevation: 1 },
    }),
  },
  vegFilterButtonActive: {
    backgroundColor: KyotoMD3.primaryContainer,
    borderColor: KyotoMD3.primary,
  },
  vegIconBox: {
    width: 13,
    height: 13,
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegIconBoxActive: {
    borderColor: KyotoMD3.primary,
  },
  vegDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2E7D32',
  },
  vegDotActive: {
    backgroundColor: KyotoMD3.primary,
  },
  vegFilterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: KyotoMD3.onSurfaceVariant,
  },
  vegFilterLabelActive: {
    color: KyotoMD3.primary,
  },
  categoryPillsContainer: {
    paddingBottom: 10,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: KyotoMD3.surfaceBright,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    ...Platform.select({
      android: { elevation: 1 },
    }),
  },
  categoryPillActive: {
    backgroundColor: KyotoMD3.primary,
    borderColor: KyotoMD3.primary,
    ...Platform.select({
      android: { elevation: 2 },
    }),
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: KyotoMD3.onSurfaceVariant,
  },
  categoryPillTextActive: {
    color: KyotoMD3.onPrimary,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 12,
  },
  shimmerList: {
    gap: 12,
  },
  shimmerCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: Radius.lg,
    backgroundColor: KyotoMD3.surfaceBright,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: KyotoMD3.onSurface,
    marginTop: 14,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: KyotoMD3.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: KyotoMD3.surfaceBright,
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    overflow: 'hidden',
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
  mediaWrap: {
    width: 104,
    height: 104,
    position: 'relative',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: KyotoMD3.surfaceContainer,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  vegBadgeWrap: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    padding: 3,
    borderRadius: 4,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(29, 27, 22, 0.85)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
  },
  ratingText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryMicroText: {
    fontSize: 10,
    fontWeight: '600',
    color: KyotoMD3.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  itemDesc: {
    fontSize: 11,
    color: KyotoMD3.onSurfaceVariant,
    lineHeight: 15,
    marginBottom: 6,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
  },
  addFabButton: {
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
});
