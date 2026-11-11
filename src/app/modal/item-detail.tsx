import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, Radius, Elevation } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { formatPaise } from '@/utils/currency';
import { useCartStore } from '@/stores/cartStore';
import { VegIndicator } from '@/components/specific/VegIndicator';
import { DietaryBadge } from '@/components/specific/DietaryBadge';
import { MediaAssets } from '@/constants/media';
import { hapticFeedback } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ItemDetailModal() {
  const router = useRouter();
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
  const isSpicy = params.isSpicy === 'true';
  const isOutOfStock = params.isOutOfStock === 'true';
  const displayImage = params.imageUrl || MediaAssets.fallbackByKeyword(params.name || '');

  // Customization Options
  const [selectedSize, setSelectedSize] = useState<'regular' | 'large'>('regular');
  const [selectedMilk, setSelectedMilk] = useState<'standard' | 'oat' | 'almond'>('standard');
  const [espressoShot, setEspressoShot] = useState<'standard' | 'double' | 'ristretto' | 'decaf'>('standard');
  const [sweetness, setSweetness] = useState<'regular' | 'less' | 'zero'>('regular');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notified, setNotified] = useState(false);

  const sizeExtraPaise = selectedSize === 'large' ? 4000 : 0;
  const milkExtraPaise = selectedMilk === 'oat' ? 3000 : selectedMilk === 'almond' ? 3500 : 0;
  const shotExtraPaise = espressoShot === 'double' ? 2500 : 0;
  const unitPricePaise = basePricePaise + sizeExtraPaise + milkExtraPaise + shotExtraPaise;
  const totalPricePaise = unitPricePaise * quantity;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    hapticFeedback.success();

    const sizeLabel = selectedSize === 'large' ? 'Large' : 'Regular';
    const milkLabel = selectedMilk === 'oat' ? 'Oat Milk' : selectedMilk === 'almond' ? 'Almond Milk' : '';
    const shotLabel = espressoShot === 'double' ? 'Double Shot' : espressoShot === 'ristretto' ? 'Ristretto' : espressoShot === 'decaf' ? 'Decaf' : '';
    const sweetnessLabel = sweetness === 'less' ? '50% Sweet' : sweetness === 'zero' ? 'Unsweetened' : '';

    const customNotes = [
      sizeLabel,
      milkLabel,
      shotLabel,
      sweetnessLabel,
      notes.trim(),
    ]
      .filter(Boolean)
      .join(' • ');

    for (let i = 0; i < quantity; i++) {
      addItem({
        menuItemId: params.id || `custom-${Date.now()}`,
        name: `${params.name || 'Café Item'} (${sizeLabel})`,
        pricePaise: unitPricePaise,
        imageUrl: displayImage,
        isVeg,
        notes: customNotes || undefined,
      });
    }

    router.back();
  };

  const handleNotifyMe = () => {
    setNotified(true);
    hapticFeedback.success();
    Alert.alert('Subscribed!', "We'll ping you the instant this artisan item is fresh out of the roaster & kitchen.");
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Full Bleed Hero Media */}
        <View style={styles.imageHeader}>
          <Image
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
            style={styles.closeButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Micro-Badges on Hero */}
          <View style={styles.heroBadgesRow}>
            <View style={styles.heroPill}>
              <Ionicons name="flash" size={13} color="#06C167" />
              <Text style={styles.heroPillText}>Prep: 12-15 min</Text>
            </View>
            <View style={styles.heroPill}>
              <Ionicons name="star" size={13} color="#FF9500" />
              <Text style={styles.heroPillText}>4.9 (1.2k+)</Text>
            </View>
          </View>

          {/* Out of stock overlay */}
          {isOutOfStock ? (
            <View style={styles.outOfStockOverlay}>
              <Ionicons name="alert-circle" size={32} color="#FFFFFF" />
              <Text style={styles.outOfStockText}>Currently Brewing / Sold Out</Text>
            </View>
          ) : null}
        </View>

        {/* Content Body */}
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.vegCategoryRow}>
                <VegIndicator isVeg={isVeg} size={16} />
                <Text style={styles.categoryBadgeText}>
                  {params.categoryName || 'Signature Roast'}
                </Text>
                {isSpicy ? <DietaryBadge type="spicy" /> : null}
              </View>
              <Text style={[Typography.editorialMedium, styles.titleText]}>
                {params.name || 'Specialty Cold Brew'}
              </Text>
            </View>
            <Text style={[Typography.h2, styles.priceText]}>
              {formatPaise(basePricePaise)}
            </Text>
          </View>

          {/* Description */}
          <Text style={[Typography.bodyMedium, styles.descriptionText]}>
            {params.description ||
              'Slow steeped for 18 hours using single-origin Ethiopian heirloom beans with tasting notes of bergamot, dark cocoa, and stone fruits.'}
          </Text>

          {/* Flavor Profile Visualizer Badges (Improvement 27) */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Flavor Profile & Sensory Notes</Text>
            <View style={styles.flavorGrid}>
              <View style={styles.flavorItem}>
                <Text style={styles.flavorLabel}>Acidity</Text>
                <Text style={styles.flavorDots}>● ● ○</Text>
                <Text style={styles.flavorSub}>Bright Citrus</Text>
              </View>
              <View style={styles.flavorItem}>
                <Text style={styles.flavorLabel}>Body</Text>
                <Text style={styles.flavorDots}>● ● ●</Text>
                <Text style={styles.flavorSub}>Velvety Full</Text>
              </View>
              <View style={styles.flavorItem}>
                <Text style={styles.flavorLabel}>Roast Level</Text>
                <Text style={styles.flavorDots}>● ● ○</Text>
                <Text style={styles.flavorSub}>Medium Craft</Text>
              </View>
            </View>
          </View>

          {/* Dietary & Allergen Warning Callout (Improvement 28) */}
          <View style={styles.allergenBanner}>
            <Ionicons name="information-circle" size={18} color="#E65100" />
            <Text style={styles.allergenText}>
              Allergen Note: Prepared in an artisanal roastery handling organic oats, almond dairy alternatives, and hazelnuts.
            </Text>
          </View>

          {/* Size Selector */}
          <View style={styles.customSection}>
            <Text style={styles.sectionHeader}>Cup Size</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionPill,
                  selectedSize === 'regular' && styles.optionPillActive,
                ]}
                onPress={() => {
                  setSelectedSize('regular');
                  hapticFeedback.selection();
                }}
              >
                <Text
                  style={[
                    styles.optionTitle,
                    selectedSize === 'regular' && styles.optionTitleActive,
                  ]}
                >
                  Regular (350ml)
                </Text>
                <Text style={styles.optionSubtitle}>Standard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionPill,
                  selectedSize === 'large' && styles.optionPillActive,
                ]}
                onPress={() => {
                  setSelectedSize('large');
                  hapticFeedback.selection();
                }}
              >
                <Text
                  style={[
                    styles.optionTitle,
                    selectedSize === 'large' && styles.optionTitleActive,
                  ]}
                >
                  Large (475ml)
                </Text>
                <Text style={styles.optionSubtitle}>+₹40</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Espresso Shot Intensity Selector (Improvement 29) */}
          <View style={styles.customSection}>
            <Text style={styles.sectionHeader}>Espresso Shot Intensity</Text>
            <View style={styles.optionsGrid}>
              {[
                { id: 'standard', label: 'Standard Single', sub: 'Balanced' },
                { id: 'double', label: 'Double Shot', sub: '+₹25' },
                { id: 'ristretto', label: 'Ristretto', sub: 'Short & Sweet' },
                { id: 'decaf', label: 'Swiss Decaf', sub: '99% Caffeine Free' },
              ].map((shot) => (
                <TouchableOpacity
                  key={shot.id}
                  style={[
                    styles.optionPillSmall,
                    espressoShot === shot.id && styles.optionPillActive,
                  ]}
                  onPress={() => {
                    setEspressoShot(shot.id as any);
                    hapticFeedback.selection();
                  }}
                >
                  <Text
                    style={[
                      styles.optionTitleSmall,
                      espressoShot === shot.id && styles.optionTitleActive,
                    ]}
                  >
                    {shot.label}
                  </Text>
                  <Text style={styles.optionSubtitleSmall}>{shot.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Milk Alternatives */}
          <View style={styles.customSection}>
            <Text style={styles.sectionHeader}>Milk Choice</Text>
            <View style={styles.optionsRow}>
              {[
                { id: 'standard', label: 'Whole Milk', sub: 'Creamy' },
                { id: 'oat', label: 'Oat Milk', sub: '+₹30' },
                { id: 'almond', label: 'Almond Milk', sub: '+₹35' },
              ].map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.optionPill,
                    selectedMilk === m.id && styles.optionPillActive,
                  ]}
                  onPress={() => {
                    setSelectedMilk(m.id as any);
                    hapticFeedback.selection();
                  }}
                >
                  <Text
                    style={[
                      styles.optionTitle,
                      selectedMilk === m.id && styles.optionTitleActive,
                    ]}
                  >
                    {m.label}
                  </Text>
                  <Text style={styles.optionSubtitle}>{m.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sweetness Level */}
          <View style={styles.customSection}>
            <Text style={styles.sectionHeader}>Sweetness Preference</Text>
            <View style={styles.optionsRow}>
              {[
                { id: 'regular', label: '100% Regular', sub: 'Classic' },
                { id: 'less', label: '50% Less Sweet', sub: 'Subtle' },
                { id: 'zero', label: '0% Unsweetened', sub: 'Pure' },
              ].map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.optionPill,
                    sweetness === s.id && styles.optionPillActive,
                  ]}
                  onPress={() => {
                    setSweetness(s.id as any);
                    hapticFeedback.selection();
                  }}
                >
                  <Text
                    style={[
                      styles.optionTitle,
                      sweetness === s.id && styles.optionTitleActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                  <Text style={styles.optionSubtitle}>{s.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Pastry Warmth & Pairing Suggestion (Improvement 30) */}
          <View style={styles.pairingCard}>
            <View style={styles.pairingLeft}>
              <Text style={styles.pairingBadge}>BARISTA PAIRING</Text>
              <Text style={styles.pairingTitle}>Warm Almond Croissant</Text>
              <Text style={styles.pairingSubtitle}>
                Flaky French laminated butter pastry with toasted almond frangipane.
              </Text>
            </View>
            <Ionicons name="sparkles" size={24} color="#06C167" />
          </View>

          {/* Barista Notes */}
          <View style={styles.customSection}>
            <Text style={styles.sectionHeader}>Special Barista Instructions</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Extra hot, splash of vanilla, no foam..."
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              maxLength={120}
            />
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Add To Cart CTA Bar */}
      <View style={styles.bottomBar}>
        {isOutOfStock ? (
          <TouchableOpacity
            style={[styles.notifyButton, notified && styles.notifyButtonDone]}
            onPress={handleNotifyMe}
            disabled={notified}
          >
            <Ionicons
              name={notified ? 'checkmark-circle' : 'notifications-outline'}
              size={20}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.notifyButtonText}>
              {notified ? 'Alert Set When Fresh' : 'Notify When Brewed'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.ctaRow}>
            {/* Quantity Stepper */}
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => {
                  if (quantity > 1) {
                    setQuantity((q) => q - 1);
                    hapticFeedback.tap();
                  }
                }}
              >
                <Ionicons name="remove" size={18} color="#000000" />
              </TouchableOpacity>
              <Text style={styles.quantityCount}>{quantity}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => {
                  setQuantity((q) => q + 1);
                  hapticFeedback.tap();
                }}
              >
                <Ionicons name="add" size={18} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Main Add Button in Uber Green */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddToCart}
              activeOpacity={0.85}
            >
              <Text style={styles.addButtonText}>
                Add to Order • {formatPaise(totalPricePaise)}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  imageHeader: {
    width: SCREEN_WIDTH,
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgesRow: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    flexDirection: 'row',
    gap: 8,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  body: {
    padding: Spacing.base,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  vegCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  categoryBadgeText: {
    color: Colors.uberGreen,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  titleText: {
    color: Colors.textPrimary,
  },
  priceText: {
    color: Colors.textPrimary,
    fontWeight: '800',
    marginLeft: Spacing.md,
  },
  descriptionText: {
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  sectionCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
  },
  flavorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flavorItem: {
    alignItems: 'center',
    flex: 1,
  },
  flavorLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  flavorDots: {
    fontSize: 13,
    color: Colors.uberGreen,
    marginVertical: 2,
    letterSpacing: 2,
  },
  flavorSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  allergenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    marginBottom: Spacing.lg,
  },
  allergenText: {
    color: '#E65100',
    fontSize: 12,
    flex: 1,
    marginLeft: 8,
    lineHeight: 17,
  },
  customSection: {
    marginBottom: Spacing.lg,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionPill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionPillSmall: {
    width: (SCREEN_WIDTH - 32 - 10) / 2,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionPillActive: {
    borderColor: Colors.uberGreen,
    backgroundColor: '#E8F8F0',
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  optionTitleSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  optionTitleActive: {
    color: Colors.uberGreenDark,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  optionSubtitleSmall: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  pairingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6FBF7',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#C7EED6',
    marginBottom: Spacing.lg,
  },
  pairingLeft: {
    flex: 1,
    marginRight: 10,
  },
  pairingBadge: {
    color: Colors.uberGreen,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  pairingTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  pairingSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  textInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    paddingBottom: 24,
    ...Elevation.md,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs,
    height: 48,
  },
  stepBtn: {
    width: 36,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    minWidth: 24,
    textAlign: 'center',
  },
  addButton: {
    flex: 1,
    backgroundColor: Colors.uberGreen,
    height: 48,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.uberGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  notifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.uberBlack,
    height: 48,
    borderRadius: Radius.sm,
  },
  notifyButtonDone: {
    backgroundColor: Colors.uberGreenDark,
  },
  notifyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
