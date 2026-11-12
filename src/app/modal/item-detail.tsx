import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Radius } from '@/constants/dimens';
import { formatPaise } from '@/utils/currency';
import { useCartStore } from '@/stores/cartStore';
import { VegIndicator } from '@/components/specific/VegIndicator';
import { CafeAsyncImage } from '@/components/common/CafeAsyncImage';
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

export default function ItemDetailModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    pricePaise: string;
    description: string;
    imageUrl?: string;
    isVeg?: string;
    isSpicy?: string;
    categoryName?: string;
    isOutOfStock?: string;
  }>();

  const addItem = useCartStore((s) => s.addItem);

  const basePricePaise = parseInt(params.pricePaise || '0', 10);
  const isVeg = params.isVeg === 'true';
  const isOutOfStock = params.isOutOfStock === 'true';
  const displayImage = params.imageUrl || MediaAssets.fallbackByKeyword(params.name || '');

  const isCoffeeOrBeverage = useMemo(() => {
    const text = `${params.name || ''} ${params.categoryName || ''}`.toLowerCase();
    return (
      text.includes('coffee') ||
      text.includes('brew') ||
      text.includes('espresso') ||
      text.includes('latte') ||
      text.includes('cappuccino') ||
      text.includes('cortado') ||
      text.includes('macchiato') ||
      text.includes('americano') ||
      text.includes('mocha') ||
      text.includes('matcha') ||
      text.includes('tea') ||
      text.includes('beverage') ||
      text.includes('drink') ||
      text.includes('pour-over')
    );
  }, [params.name, params.categoryName]);

  // Beverage & Food Customization Options
  const [selectedSize, setSelectedSize] = useState<'regular' | 'large'>('regular');
  const [selectedMilk, setSelectedMilk] = useState<'standard' | 'oat' | 'almond'>('standard');
  const [espressoShot, setEspressoShot] = useState<'standard' | 'double'>('standard');
  const [sweetness, setSweetness] = useState<'regular' | 'less' | 'zero'>('zero');
  const [servingTemp, setServingTemp] = useState<'hot' | 'iced'>('hot');
  const [foodPrep, setFoodPrep] = useState<'toasted' | 'fresh'>('toasted');
  const [foodFinishing, setFoodFinishing] = useState<'butter' | 'olive_oil' | 'plain'>('butter');

  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  const sizeExtraPaise = selectedSize === 'large' ? 4000 : 0;
  const milkExtraPaise = isCoffeeOrBeverage ? (selectedMilk === 'oat' ? 3000 : selectedMilk === 'almond' ? 3500 : 0) : 0;
  const shotExtraPaise = isCoffeeOrBeverage ? (espressoShot === 'double' ? 2500 : 0) : 0;
  const unitPricePaise = basePricePaise + sizeExtraPaise + milkExtraPaise + shotExtraPaise;
  const totalPricePaise = unitPricePaise * quantity;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const sizeLabel = selectedSize === 'large' ? (isCoffeeOrBeverage ? 'Large (475ml)' : 'Large Portion') : (isCoffeeOrBeverage ? 'Regular (350ml)' : 'Standard Portion');

    const customNotes = isCoffeeOrBeverage
      ? [
          sizeLabel,
          servingTemp === 'hot' ? 'Hot & Steamed' : 'Over Clear Ice',
          selectedMilk === 'oat' ? 'Oat Milk' : selectedMilk === 'almond' ? 'Almond Milk' : 'Jersey Whole',
          espressoShot === 'double' ? 'Double Shot' : '',
          sweetness === 'less' ? 'Subtle Sweet (50%)' : sweetness === 'zero' ? 'Unsweetened (0%)' : 'Standard Sweet',
          notes.trim(),
        ]
          .filter(Boolean)
          .join(' • ')
      : [
          sizeLabel,
          foodPrep === 'toasted' ? 'Warm & Toasted' : 'Ambient Fresh',
          foodFinishing === 'butter' ? 'Artisan Herb Butter' : foodFinishing === 'olive_oil' ? 'EVOO & Sea Salt' : 'Plain / No Topping',
          notes.trim(),
        ]
          .filter(Boolean)
          .join(' • ');

    for (let i = 0; i < quantity; i++) {
      addItem({
        menuItemId: params.id || `custom-${Date.now()}`,
        name: `${params.name || 'Café Item'} (${selectedSize === 'large' ? 'Large' : 'Regular'})`,
        pricePaise: unitPricePaise,
        imageUrl: displayImage,
        isVeg,
        notes: customNotes || undefined,
      });
    }

    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Full-Bleed Hero Image */}
        <View style={styles.imageHeader}>
          <CafeAsyncImage
            source={{ uri: displayImage }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { top: Math.max(insets.top, 16) + 8 }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Floating Badges on Hero */}
          <View style={styles.heroBadgesRow}>
            <View style={styles.heroPill}>
              <Ionicons name="star" size={11} color={KyotoMD3.ratingStar} />
              <Text style={styles.heroPillText}>4.98 (Reserve)</Text>
            </View>
            <View style={styles.heroPill}>
              <Ionicons name="time-outline" size={12} color="#FFFFFF" />
              <Text style={styles.heroPillText}>10-12 min brew</Text>
            </View>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.body}>
          {/* Title & Price Header */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.vegCategoryRow}>
                <VegIndicator isVeg={isVeg} size={13} />
                <Text style={styles.categoryBadgeText}>
                  {params.categoryName || 'Artisan Special'}
                </Text>
              </View>
              <Text style={styles.titleText}>
                {params.name || 'Specialty Roast'}
              </Text>
            </View>
            <Text style={styles.priceText}>
              {formatPaise(basePricePaise)}
            </Text>
          </View>

          {/* Sensory Description */}
          <Text style={styles.descriptionText}>
            {params.description ||
              'Hand-harvested Boquete micro-lot with notes of white jasmine florals, Meyer lemon sweetness, and delicate bergamot finish.'}
          </Text>

          {/* Option Group 1: Portion Size */}
          <View style={styles.optGroup}>
            <View style={styles.optGroupHeader}>
              <Text style={styles.optGroupTitle}>PORTION SIZE</Text>
              <View style={styles.requiredCapsule}>
                <Text style={styles.requiredCapsuleText}>REQUIRED</Text>
              </View>
            </View>
            <View style={styles.optPillsRow}>
              <Pressable
                style={[styles.optPill, selectedSize === 'regular' && styles.optPillActive]}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedSize('regular');
                }}
              >
                <Text style={[styles.optPillName, selectedSize === 'regular' && styles.optPillNameActive]}>
                  {isCoffeeOrBeverage ? 'Regular (350ml)' : 'Standard Portion'}
                </Text>
                <Text style={styles.optPillSub}>+₹0</Text>
              </Pressable>

              <Pressable
                style={[styles.optPill, selectedSize === 'large' && styles.optPillActive]}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedSize('large');
                }}
              >
                <Text style={[styles.optPillName, selectedSize === 'large' && styles.optPillNameActive]}>
                  {isCoffeeOrBeverage ? 'Large (475ml)' : 'Large Portion'}
                </Text>
                <Text style={styles.optPillSub}>+₹40</Text>
              </Pressable>
            </View>
          </View>

          {/* Conditional Options (Beverage vs Food) */}
          {isCoffeeOrBeverage ? (
            <>
              {/* Serving Style */}
              <View style={styles.optGroup}>
                <View style={styles.optGroupHeader}>
                  <Text style={styles.optGroupTitle}>SERVING STYLE</Text>
                </View>
                <View style={styles.optPillsRow}>
                  <Pressable
                    style={[styles.optPill, servingTemp === 'hot' && styles.optPillActive]}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setServingTemp('hot');
                    }}
                  >
                    <Ionicons
                      name="flame-outline"
                      size={14}
                      color={servingTemp === 'hot' ? KyotoMD3.primary : KyotoMD3.onSurfaceVariant}
                    />
                    <Text style={[styles.optPillName, servingTemp === 'hot' && styles.optPillNameActive]}>
                      Hot &amp; Steamed
                    </Text>
                    <Text style={styles.optPillSub}>65°C</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.optPill, servingTemp === 'iced' && styles.optPillActive]}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setServingTemp('iced');
                    }}
                  >
                    <Ionicons
                      name="snow-outline"
                      size={14}
                      color={servingTemp === 'iced' ? KyotoMD3.primary : KyotoMD3.onSurfaceVariant}
                    />
                    <Text style={[styles.optPillName, servingTemp === 'iced' && styles.optPillNameActive]}>
                      Over Clear Ice
                    </Text>
                    <Text style={styles.optPillSub}>Chilled</Text>
                  </Pressable>
                </View>
              </View>

              {/* Milk Choice */}
              <View style={styles.optGroup}>
                <View style={styles.optGroupHeader}>
                  <Text style={styles.optGroupTitle}>CHOICE OF MILK</Text>
                  <View style={styles.requiredCapsule}>
                    <Text style={styles.requiredCapsuleText}>REQUIRED</Text>
                  </View>
                </View>
                <View style={styles.optPillsRow}>
                  <Pressable
                    style={[styles.optPill, selectedMilk === 'standard' && styles.optPillActive]}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedMilk('standard');
                    }}
                  >
                    <Text style={[styles.optPillName, selectedMilk === 'standard' && styles.optPillNameActive]}>
                      Jersey Whole
                    </Text>
                    <Text style={styles.optPillSub}>+₹0</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.optPill, selectedMilk === 'oat' && styles.optPillActive]}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedMilk('oat');
                    }}
                  >
                    <Text style={[styles.optPillName, selectedMilk === 'oat' && styles.optPillNameActive]}>
                      Oat Milk
                    </Text>
                    <Text style={styles.optPillSub}>+₹30</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.optPill, selectedMilk === 'almond' && styles.optPillActive]}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedMilk('almond');
                    }}
                  >
                    <Text style={[styles.optPillName, selectedMilk === 'almond' && styles.optPillNameActive]}>
                      Almond Milk
                    </Text>
                    <Text style={styles.optPillSub}>+₹35</Text>
                  </Pressable>
                </View>
              </View>

              {/* Sweetness */}
              <View style={styles.optGroup}>
                <View style={styles.optGroupHeader}>
                  <Text style={styles.optGroupTitle}>SWEETNESS LEVEL</Text>
                </View>
                <View style={styles.optPillsRow}>
                  <Pressable
                    style={[styles.optPill, sweetness === 'zero' && styles.optPillActive]}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSweetness('zero');
                    }}
                  >
                    <Text style={[styles.optPillName, sweetness === 'zero' && styles.optPillNameActive]}>
                      Unsweetened
                    </Text>
                    <Text style={styles.optPillSub}>0%</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.optPill, sweetness === 'less' && styles.optPillActive]}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSweetness('less');
                    }}
                  >
                    <Text style={[styles.optPillName, sweetness === 'less' && styles.optPillNameActive]}>
                      Subtle Sweet
                    </Text>
                    <Text style={styles.optPillSub}>50%</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.optPill, sweetness === 'regular' && styles.optPillActive]}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSweetness('regular');
                    }}
                  >
                    <Text style={[styles.optPillName, sweetness === 'regular' && styles.optPillNameActive]}>
                      Standard
                    </Text>
                    <Text style={styles.optPillSub}>100%</Text>
                  </Pressable>
                </View>
              </View>

              {/* Espresso Boost */}
              <View style={styles.optGroup}>
                <View style={styles.optGroupHeader}>
                  <Text style={styles.optGroupTitle}>ESPRESSO EXTRACTION</Text>
                </View>
                <View style={styles.optPillsRow}>
                  <Pressable
                    style={[styles.optPill, espressoShot === 'standard' && styles.optPillActive]}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setEspressoShot('standard');
                    }}
                  >
                    <Text style={[styles.optPillName, espressoShot === 'standard' && styles.optPillNameActive]}>
                      Single Shot
                    </Text>
                    <Text style={styles.optPillSub}>Included</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.optPill, espressoShot === 'double' && styles.optPillActive]}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setEspressoShot('double');
                    }}
                  >
                    <Text style={[styles.optPillName, espressoShot === 'double' && styles.optPillNameActive]}>
                      Double Shot
                    </Text>
                    <Text style={styles.optPillSub}>+₹25</Text>
                  </Pressable>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Bakery Preparation */}
              <View style={styles.optGroup}>
                <View style={styles.optGroupHeader}>
                  <Text style={styles.optGroupTitle}>WARMING PREFERENCE</Text>
                </View>
                <View style={styles.optPillsRow}>
                  <Pressable
                    style={[styles.optPill, foodPrep === 'toasted' && styles.optPillActive]}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFoodPrep('toasted');
                    }}
                  >
                    <Text style={[styles.optPillName, foodPrep === 'toasted' && styles.optPillNameActive]}>
                      Warm &amp; Toasted
                    </Text>
                    <Text style={styles.optPillSub}>Oven fresh</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.optPill, foodPrep === 'fresh' && styles.optPillActive]}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFoodPrep('fresh');
                    }}
                  >
                    <Text style={[styles.optPillName, foodPrep === 'fresh' && styles.optPillNameActive]}>
                      Ambient Fresh
                    </Text>
                    <Text style={styles.optPillSub}>Room temp</Text>
                  </Pressable>
                </View>
              </View>

              {/* Finishing Spread */}
              <View style={styles.optGroup}>
                <View style={styles.optGroupHeader}>
                  <Text style={styles.optGroupTitle}>FINISHING SPREAD</Text>
                </View>
                <View style={styles.optPillsRow}>
                  <Pressable
                    style={[styles.optPill, foodFinishing === 'butter' && styles.optPillActive]}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFoodFinishing('butter');
                    }}
                  >
                    <Text style={[styles.optPillName, foodFinishing === 'butter' && styles.optPillNameActive]}>
                      Artisan Butter
                    </Text>
                    <Text style={styles.optPillSub}>Included</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.optPill, foodFinishing === 'olive_oil' && styles.optPillActive]}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFoodFinishing('olive_oil');
                    }}
                  >
                    <Text style={[styles.optPillName, foodFinishing === 'olive_oil' && styles.optPillNameActive]}>
                      EVOO &amp; Sea Salt
                    </Text>
                    <Text style={styles.optPillSub}>Extra virgin</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}

          {/* Barista Notes */}
          <View style={styles.optGroup}>
            <View style={styles.optGroupHeader}>
              <Text style={styles.optGroupTitle}>BARISTA / KITCHEN NOTES</Text>
            </View>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. Extra hot, no lid, napkin on side..."
              placeholderTextColor={KyotoMD3.outline}
              value={notes}
              onChangeText={setNotes}
              maxLength={120}
            />
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Add Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.stepperContainer}>
          <TouchableOpacity
            style={styles.stepButton}
            onPress={() => {
              Haptics.selectionAsync();
              setQuantity(Math.max(1, quantity - 1));
            }}
          >
            <Ionicons name="remove" size={16} color={KyotoMD3.onSurface} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.stepButton}
            onPress={() => {
              Haptics.selectionAsync();
              setQuantity(quantity + 1);
            }}
          >
            <Ionicons name="add" size={16} color={KyotoMD3.onSurface} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addToCartButton}
          activeOpacity={0.85}
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartText}>
            Add to Table Order • {formatPaise(totalPricePaise)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KyotoMD3.surface,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  imageHeader: {
    width: '100%',
    height: 250,
    position: 'relative',
    backgroundColor: KyotoMD3.surfaceContainerHigh,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    right: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(29, 27, 22, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroBadgesRow: {
    position: 'absolute',
    bottom: 14,
    left: 20,
    flexDirection: 'row',
    gap: 8,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(29, 27, 22, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  body: {
    padding: 20,
    backgroundColor: KyotoMD3.surface,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  vegCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: KyotoMD3.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
    letterSpacing: -0.5,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
  },
  descriptionText: {
    fontSize: 13,
    color: KyotoMD3.onSurfaceVariant,
    lineHeight: 19,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: KyotoMD3.outlineSubtle,
  },
  optGroup: {
    marginBottom: 20,
  },
  optGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  optGroupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
    letterSpacing: 0.8,
  },
  requiredCapsule: {
    backgroundColor: KyotoMD3.secondaryContainer,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  requiredCapsuleText: {
    fontSize: 9,
    fontWeight: '800',
    color: KyotoMD3.secondary,
  },
  optPillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optPill: {
    flex: 1,
    minWidth: 100,
    backgroundColor: KyotoMD3.surfaceBright,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    alignItems: 'center',
    gap: 2,
    ...Platform.select({
      android: { elevation: 1 },
    }),
  },
  optPillActive: {
    backgroundColor: KyotoMD3.primaryContainer,
    borderColor: KyotoMD3.primary,
    borderWidth: 1.5,
  },
  optPillName: {
    fontSize: 12,
    fontWeight: '700',
    color: KyotoMD3.onSurface,
    textAlign: 'center',
  },
  optPillNameActive: {
    color: KyotoMD3.primary,
  },
  optPillSub: {
    fontSize: 10,
    color: KyotoMD3.onSurfaceVariant,
  },
  notesInput: {
    backgroundColor: KyotoMD3.surfaceBright,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    padding: 12,
    fontSize: 12,
    color: KyotoMD3.onSurface,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingTop: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: KyotoMD3.outlineSubtle,
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
    }),
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KyotoMD3.surfaceContainer,
    borderRadius: Radius.full,
    padding: 4,
    gap: 8,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: KyotoMD3.surfaceBright,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { elevation: 1 },
    }),
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
    minWidth: 18,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: KyotoMD3.primary,
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { elevation: 2 },
    }),
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
