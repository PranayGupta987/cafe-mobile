import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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

  return (
    <View style={styles.container}>
      {/* Search & Filter Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search coffee, drinks, snacks..."
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
          <Text style={[Typography.bodyMedium, { color: Colors.textPrimary }]}>Veg Only</Text>
          <Switch
            value={vegOnly}
            onValueChange={setVegOnly}
            trackColor={{ false: Colors.border, true: '#2E7D32' }}
            thumbColor="#FFFFFF"
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.categoryPillsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === null && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === null && styles.categoryPillTextActive,
              ]}
            >
              All Items
            </Text>
          </TouchableOpacity>

          {categoriesData?.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                selectedCategory === cat.id && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
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
      <ScrollView contentContainerStyle={styles.listContent}>
        {isLoading ? (
          <View style={{ gap: Spacing.md }}>
            {[1, 2, 3, 4].map((key) => (
              <View key={key} style={styles.shimmerCard}>
                <View style={{ flex: 1, gap: 8 }}>
                  <Shimmer width={140} height={18} />
                  <Shimmer width={80} height={14} />
                  <Shimmer width="85%" height={12} />
                </View>
                <Shimmer width={80} height={36} radius={Radius.sm} />
              </View>
            ))}
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.textMuted} />
            <Text style={[Typography.bodyMedium, { color: Colors.textMuted, marginTop: Spacing.md }]}>
              No items found matching your filter
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => {
            const qty = getItemQuantity(item.id);
            return (
              <CafeCard key={item.id} variant="elevated" style={styles.itemCard}>
                <View style={styles.itemRow}>
                  <View style={styles.itemDetails}>
                    <View style={styles.metaRow}>
                      <VegIndicator isVeg={item.isVeg} size={14} />
                      {item.isSpicy ? (
                        <Ionicons
                          name="flame"
                          size={14}
                          color={Colors.error}
                          style={{ marginLeft: 4 }}
                        />
                      ) : null}
                      {item.category?.name ? (
                        <Text style={styles.categoryTag}>{item.category.name}</Text>
                      ) : null}
                    </View>

                    <Text style={[Typography.titleMedium, styles.itemName]}>{item.name}</Text>
                    <Text style={[Typography.bodyMedium, styles.itemPrice]}>
                      {formatPaise(item.pricePaise)}
                    </Text>
                    <Text style={[Typography.bodySmall, styles.itemDesc]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>

                  <View style={styles.stepperContainer}>
                    <QuantityStepper
                      quantity={qty}
                      onIncrement={() =>
                        addItem({
                          menuItemId: item.id,
                          name: item.name,
                          pricePaise: item.pricePaise,
                          imageUrl: item.imageUrl,
                          isVeg: item.isVeg,
                        })
                      }
                      onDecrement={() => decrementItem(item.id)}
                    />
                  </View>
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
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    height: 40,
    borderRadius: Radius.md,
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
    marginLeft: Spacing.md,
  },
  categoryPillsContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.base,
  },
  categoryPill: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillActive: {
    backgroundColor: Colors.cafeBrown,
    borderColor: Colors.cafeBrown,
  },
  categoryPillText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: Spacing.base,
    paddingBottom: 90,
  },
  itemCard: {
    marginBottom: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemDetails: {
    flex: 1,
    marginRight: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryTag: {
    ...Typography.labelSmall,
    color: Colors.textMuted,
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  itemName: {
    color: Colors.textPrimary,
  },
  itemPrice: {
    color: Colors.cafeBrown,
    fontWeight: '700',
    marginTop: 2,
  },
  itemDesc: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  stepperContainer: {
    alignItems: 'flex-end',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  shimmerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Elevation.sm,
  },
});
