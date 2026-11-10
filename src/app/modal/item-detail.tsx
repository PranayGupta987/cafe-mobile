import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { Spacing, Radius, Elevation } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { formatPaise } from '@/utils/currency';
import { useCartStore } from '@/stores/cartStore';
import { VegIndicator } from '@/components/specific/VegIndicator';
import { MediaAssets } from '@/constants/media';

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
  }>();

  const addItem = useCartStore((s) => s.addItem);

  const basePricePaise = parseInt(params.pricePaise || '0', 10);
  const isVeg = params.isVeg === 'true';
  const isSpicy = params.isSpicy === 'true';
  const displayImage = params.imageUrl || MediaAssets.fallbackByKeyword(params.name || '');

  // Customization Options
  const [selectedSize, setSelectedSize] = useState<'regular' | 'large'>('regular');
  const [selectedMilk, setSelectedMilk] = useState<'standard' | 'oat' | 'almond'>('standard');
  const [sweetness, setSweetness] = useState<'regular' | 'less' | 'zero'>('regular');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  const sizeExtraPaise = selectedSize === 'large' ? 4000 : 0;
  const milkExtraPaise = selectedMilk === 'oat' ? 3000 : selectedMilk === 'almond' ? 3500 : 0;
  const unitPricePaise = basePricePaise + sizeExtraPaise + milkExtraPaise;
  const totalPricePaise = unitPricePaise * quantity;

  const handleAddToCart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const sizeLabel = selectedSize === 'large' ? 'Large' : 'Regular';
    const milkLabel = selectedMilk === 'oat' ? 'Oat Milk' : selectedMilk === 'almond' ? 'Almond Milk' : '';
    const sweetnessLabel = sweetness === 'less' ? '50% Sweet' : sweetness === 'zero' ? 'Unsweetened' : '';

    const customNotes = [
      sizeLabel,
      milkLabel,
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

          {/* Top Navigation Overlay */}
          <View style={styles.navBar}>
            <TouchableOpacity
              style={styles.circleButton}
              onPress={() => router.back()}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.badgeRow}>
              {params.categoryName ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{params.categoryName}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Hero Bottom Overlay Title */}
          <View style={styles.titleOverlay}>
            <View style={styles.vegSpicyRow}>
              <VegIndicator isVeg={isVeg} size={16} />
              {isSpicy ? (
                <View style={styles.spicyBadge}>
                  <Ionicons name="flame" size={14} color="#FFFFFF" />
                  <Text style={styles.spicyBadgeText}>Spicy</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.heroTitle}>{params.name}</Text>
            <Text style={styles.heroPrice}>{formatPaise(unitPricePaise)}</Text>
          </View>
        </View>

        {/* Details & Customizations */}
        <View style={styles.detailsBody}>
          <Text style={styles.descriptionText}>
            {params.description ||
              'Artisanal batch prepared with ethically sourced ingredients, precision temperature extraction, and signature café craft.'}
          </Text>

          {/* Highlights / Pills */}
          <View style={styles.pillsRow}>
            <View style={styles.pill}>
              <Ionicons name="time-outline" size={16} color={Colors.cafeBrown} />
              <Text style={styles.pillText}>3-5 min brew</Text>
            </View>
            <View style={styles.pill}>
              <Ionicons name="flame-outline" size={16} color={Colors.cafeBrown} />
              <Text style={styles.pillText}>~180 kcal</Text>
            </View>
            <View style={styles.pill}>
              <Ionicons name="sparkles-outline" size={16} color={Colors.cafeGold} />
              <Text style={styles.pillText}>Barista Pick</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Size Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Choice of Size</Text>
            <View style={styles.choiceRow}>
              <TouchableOpacity
                style={[styles.choiceCard, selectedSize === 'regular' && styles.choiceCardActive]}
                onPress={() => setSelectedSize('regular')}
              >
                <Ionicons
                  name="cafe"
                  size={20}
                  color={selectedSize === 'regular' ? Colors.cafeBrown : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.choiceTitle,
                    selectedSize === 'regular' && styles.choiceTitleActive,
                  ]}
                >
                  Regular
                </Text>
                <Text style={styles.choiceSubtitle}>Standard 250ml</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.choiceCard, selectedSize === 'large' && styles.choiceCardActive]}
                onPress={() => setSelectedSize('large')}
              >
                <Ionicons
                  name="cafe"
                  size={26}
                  color={selectedSize === 'large' ? Colors.cafeBrown : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.choiceTitle,
                    selectedSize === 'large' && styles.choiceTitleActive,
                  ]}
                >
                  Large (+₹40)
                </Text>
                <Text style={styles.choiceSubtitle}>Grande 380ml</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Milk Options */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Milk Preference</Text>
            <View style={styles.optionsList}>
              {[
                { id: 'standard', label: 'Whole Dairy Milk', extra: 'Included' },
                { id: 'oat', label: 'Oat Milk (Barista Blend)', extra: '+₹30' },
                { id: 'almond', label: 'Roasted Almond Milk', extra: '+₹35' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.optionRow,
                    selectedMilk === opt.id && styles.optionRowActive,
                  ]}
                  onPress={() => setSelectedMilk(opt.id as any)}
                >
                  <View style={styles.radioCircle}>
                    {selectedMilk === opt.id ? <View style={styles.radioInner} /> : null}
                  </View>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                  <Text style={styles.optionExtra}>{opt.extra}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Sweetness */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Sweetness Level</Text>
            <View style={styles.tagRow}>
              {[
                { id: 'regular', label: 'Standard Sweet' },
                { id: 'less', label: '50% Less Sweet' },
                { id: 'zero', label: 'Zero Sugar' },
              ].map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.tag, sweetness === s.id && styles.tagActive]}
                  onPress={() => setSweetness(s.id as any)}
                >
                  <Text style={[styles.tagText, sweetness === s.id && styles.tagTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Barista Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Special Preparation Request</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. Extra hot, double shot, cinnamon on top..."
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={120}
            />
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Add-To-Cart Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.quantityPicker}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Ionicons name="remove" size={18} color={Colors.cafeBrown} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity(quantity + 1)}
          >
            <Ionicons name="add" size={18} color={Colors.cafeBrown} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addCta}
          activeOpacity={0.88}
          onPress={handleAddToCart}
        >
          <Text style={styles.addCtaText}>Add to Order</Text>
          <Text style={styles.addCtaPrice}>{formatPaise(totalPricePaise)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  imageHeader: {
    width: SCREEN_WIDTH,
    height: 340,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  navBar: {
    position: 'absolute',
    top: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  categoryBadgeText: {
    color: Colors.espressoDark,
    fontSize: 12,
    fontWeight: '700',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  vegSpicyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  spicyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 2,
  },
  spicyBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroPrice: {
    color: Colors.caramel,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  detailsBody: {
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    marginTop: -20,
  },
  descriptionText: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.base,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.cafeBrownContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  pillText: {
    fontSize: 12,
    color: Colors.cafeBrown,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  choiceCard: {
    flex: 1,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  choiceCardActive: {
    borderColor: Colors.cafeBrown,
    backgroundColor: Colors.cafeBrownContainer,
  },
  choiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 6,
  },
  choiceTitleActive: {
    color: Colors.cafeBrown,
  },
  choiceSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  optionsList: {
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optionRowActive: {
    borderColor: Colors.cafeBrown,
    backgroundColor: Colors.cafeBrownContainer,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.cafeBrown,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.cafeBrown,
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  optionExtra: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.cafeBrown,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  tagActive: {
    backgroundColor: Colors.cafeBrown,
    borderColor: Colors.cafeBrown,
  },
  tagText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Elevation.lg,
  },
  quantityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    paddingHorizontal: 10,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addCta: {
    flex: 1,
    backgroundColor: Colors.cafeBrown,
    borderRadius: Radius.full,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Elevation.md,
  },
  addCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  addCtaPrice: {
    color: Colors.caramel,
    fontSize: 16,
    fontWeight: '800',
  },
});
