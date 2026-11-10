import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useCartStore } from '@/stores/cartStore';
import { CafeCard } from '@/components/common/Card';
import { QuantityStepper } from '@/components/specific/QuantityStepper';
import { VegIndicator } from '@/components/specific/VegIndicator';
import { FloatingCartBar } from '@/components/specific/FloatingCartBar';
import { Shimmer } from '@/components/common/Shimmer';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Elevation } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { formatPaise } from '@/utils/currency';
import { ApiResponse } from '@/types/auth';
import { MediaAssets } from '@/constants/media';

export default function MenuScreen() {
  const router = useRouter();
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
      {/* Search & Filter Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search pour-overs, pastries, beans..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.vegToggleRow}>
          <Text style={styles.vegToggleLabel}>Veg Only</Text>
          <Switch
            value={vegOnly}
            onValueChange={(val) => {
              Haptics.selectionAsync();
              setVegOnly(val);
            }}
            trackColor={{ false: Colors.border, true: Colors.success }}
            thumbColor="#FFFFFF"
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.categoryPillsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === null && styles.categoryPillActive,
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedCategory(null);
            }}
          >
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === null && styles.categoryPillTextActive,
              ]}
            >
              All Items ({itemsData?.length || 0})
            </Text>
          </TouchableOpacity>

          {categoriesData?.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                selectedCategory === cat.id && styles.categoryPillActive,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedCategory(cat.id);
              }}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === cat.id && styles.categoryPillTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Menu Item List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ gap: Spacing.md }}>
            {[1, 2, 3, 4].map((key) => (
              <View key={key} style={styles.shimmerCard}>
                <Shimmer width={100} height={100} radius={Radius.md} />
                <View style={{ flex: 1, gap: 8, marginLeft: 12 }}>
                  <Shimmer width={140} height={18} />
                  <Shimmer width={80} height={14} />
                  <Shimmer width="85%" height={12} />
                </View>
              </View>
            ))}
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.textMuted} />
            <Text style={[Typography.bodyMedium, { color: Colors.textMuted, marginTop: Spacing.md }]}>
              No culinary items found matching your filters
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => {
            const qty = getItemQuantity(item.id);
            const imageUrl = item.imageUrl || MediaAssets.fallbackByKeyword(item.name);

            return (
              <CafeCard key={item.id} variant="elevated" style={styles.itemCard}>
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => handleOpenDetail(item)}
                  style={styles.itemTouchArea}
                >
                  {/* Food Media Thumbnail */}
                  <View style={styles.thumbWrapper}>
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.thumbImage}
                      contentFit="cover"
                      transition={200}
                    />
                    <View style={styles.thumbVegBadge}>
                      <VegIndicator isVeg={item.isVeg} size={11} />
                    </View>
                  </View>

                  {/* Details Body */}
                  <View style={styles.itemDetails}>
                    <View style={styles.metaRow}>
                      {item.isSpicy ? (
                        <View style={styles.spicyTag}>
                          <Ionicons name="flame" size={11} color={Colors.error} />
                          <Text style={styles.spicyText}>Spicy</Text>
                        </View>
                      ) : null}
                      {item.category?.name ? (
                        <Text style={styles.categoryTag}>{item.category.name}</Text>
                      ) : null}
                    </View>

                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemDesc} numberOfLines={2}>
                      {item.description}
                    </Text>

                    <View style={styles.bottomRow}>
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
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    height: 42,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  vegToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vegToggleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  categoryPillsContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.base,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillActive: {
    backgroundColor: Colors.cafeBrown,
    borderColor: Colors.cafeBrown,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: Spacing.base,
    paddingBottom: 130,
    gap: 12,
  },
  shimmerCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 0,
    overflow: 'hidden',
  },
  itemTouchArea: {
    flexDirection: 'row',
    padding: Spacing.md,
  },
  thumbWrapper: {
    width: 104,
    height: 104,
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.background,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbVegBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: 3,
    borderRadius: 4,
  },
  itemDetails: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spicyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.errorContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  spicyText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.error,
  },
  categoryTag: {
    fontSize: 11,
    color: Colors.cafeGoldDark,
    fontWeight: '700',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  itemDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
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
