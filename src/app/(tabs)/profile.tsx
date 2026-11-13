import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { CafeAsyncImage } from '@/components/common/CafeAsyncImage';
import { Radius } from '@/constants/dimens';
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

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { tableNumber, setTable, clearCart } = useCartStore();

  const [stamps] = useState(6);
  const totalStamps = 8;

  const handleLeaveTable = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Leave Table Session',
      `Are you sure you want to release Table ${tableNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release Table',
          style: 'destructive',
          onPress: () => {
            setTable(null, null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Table Released', 'You have checked out of your table session.');
          },
        },
      ]
    );
  };

  const handleStampClaim = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Kyoto Roastery Club ⭐',
      `You currently have ${stamps} of ${totalStamps} stamps! Collect ${totalStamps - stamps} more stamps on specialty pour-overs to unlock a complimentary Reserve Geisha brew.`
    );
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your artisan profile?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          clearCart();
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header Bar */}
      <View style={[styles.topAppBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 4) }]}>
        <View style={styles.headerTitleCol}>
          <View style={styles.tableChip}>
            <View style={styles.tableDot} />
            <Text style={styles.tableChipText}>Kyoto Reserve Member</Text>
          </View>
          <Text style={styles.brandTitleText}>Guest Profile</Text>
        </View>

        <Pressable
          style={styles.iconButtonMD3}
          android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true }}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color={KyotoMD3.onSurface} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card with 4K Media Header */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.profileBannerWrap}>
            <CafeAsyncImage
              source={{ uri: MediaAssets.heroes.roasteryMachine }}
              style={styles.profileBannerImage}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.bannerOverlay} />
          </View>

          <View style={styles.profileInfoContent}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {user?.name
                  ? user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : 'KG'}
              </Text>
            </View>

            <Text style={styles.userNameText}>{user?.name || 'Kyoto Connoisseur'}</Text>
            <Text style={styles.userEmailText}>{user?.email || 'coffee.lover@kyotocraft.jp'}</Text>
            {user?.phone ? <Text style={styles.userPhoneText}>{user.phone}</Text> : null}

            <View style={styles.memberStatusBadge}>
              <Ionicons name="sparkles" size={11} color={KyotoMD3.primary} style={{ marginRight: 4 }} />
              <Text style={styles.memberStatusText}>{user?.role || 'COFFEE CLUB GOLD'}</Text>
            </View>
          </View>
        </View>

        {/* Loyalty Stamp Card */}
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyHeader}>
            <View>
              <Text style={styles.loyaltyTitle}>Specialty Brew Stamp Card</Text>
              <Text style={styles.loyaltySubtitle}>
                {stamps} of {totalStamps} stamps collected
              </Text>
            </View>
            <TouchableOpacity onPress={handleStampClaim} style={styles.loyaltyBadgePill}>
              <Text style={styles.loyaltyBadgePillText}>2 Left for Free Brew</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.stampGrid}>
            {Array.from({ length: totalStamps }).map((_, idx) => {
              const isStamped = idx < stamps;
              const isFreeReward = idx === totalStamps - 1;

              return (
                <View
                  key={idx}
                  style={[
                    styles.stampCircle,
                    isStamped && styles.stampCircleActive,
                    isFreeReward && styles.stampCircleGift,
                  ]}
                >
                  <Ionicons
                    name={isFreeReward ? 'gift' : isStamped ? 'cafe' : 'ellipse-outline'}
                    size={16}
                    color={isStamped || isFreeReward ? '#FFFFFF' : KyotoMD3.outline}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Active Table Status */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="restaurant-outline" size={20} color={KyotoMD3.primary} />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Active Dine-In Table</Text>
              <Text style={styles.sectionSubtitle}>
                {tableNumber ? `Checked into Table ${tableNumber}` : 'No table session currently active'}
              </Text>
            </View>
            {tableNumber ? (
              <TouchableOpacity onPress={handleLeaveTable} style={styles.leaveButton}>
                <Text style={styles.leaveButtonText}>Leave</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.push('/modal/qr-scanner')}
                style={styles.scanButton}
              >
                <Text style={styles.scanButtonText}>Scan QR</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Floorplan & Reservations Shortcut */}
        <Pressable
          style={styles.sectionCard}
          android_ripple={{ color: 'rgba(0,0,0,0.04)' }}
          onPress={() => router.push('/modal/reservations')}
        >
          <View style={styles.sectionRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={20} color={KyotoMD3.primary} />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Floorplan &amp; Table Reservations</Text>
              <Text style={styles.sectionSubtitle}>
                Reserve handcrafted window booths and split bills
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={KyotoMD3.outline} />
          </View>
        </Pressable>

        {/* Kitchen Display System Switch (Staff/Admin) */}
        {user?.role === 'KITCHEN' || user?.role === 'CAFE_STAFF' || user?.role === 'CAFE_ADMIN' ? (
          <Pressable
            style={styles.sectionCard}
            android_ripple={{ color: 'rgba(0,0,0,0.04)' }}
            onPress={() => router.push('/kitchen')}
          >
            <View style={styles.sectionRow}>
              <View style={[styles.iconCircle, { backgroundColor: KyotoMD3.primaryContainer }]}>
                <Ionicons name="desktop-outline" size={20} color={KyotoMD3.primary} />
              </View>
              <View style={styles.sectionInfo}>
                <Text style={styles.sectionTitle}>Kitchen Display System</Text>
                <Text style={styles.sectionSubtitle}>
                  Switch to live kitchen order fulfillment terminal
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={KyotoMD3.outline} />
            </View>
          </Pressable>
        ) : null}

        {/* Roastery Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.cafeDetailsHeading}>Kyoto Roastery Details</Text>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color={KyotoMD3.primary} />
            <Text style={styles.infoText}>Open Daily: 08:00 AM – 11:00 PM</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={KyotoMD3.primary} />
            <Text style={styles.infoText}>123 Artisanal Roastery Lane, Indiranagar, Bengaluru</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={KyotoMD3.primary} />
            <Text style={styles.infoText}>+91 98765 43210</Text>
          </View>
        </View>

        {/* Sign Out CTA */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={16} color="#B3261E" />
          <Text style={styles.logoutBtnText}>Sign Out of Roastery</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingTop: 16,
    gap: 14,
  },
  profileHeaderCard: {
    backgroundColor: KyotoMD3.surfaceBright,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    ...Platform.select({
      android: { elevation: 2 },
    }),
  },
  profileBannerWrap: {
    width: '100%',
    height: 90,
    position: 'relative',
    backgroundColor: KyotoMD3.surfaceContainer,
  },
  profileBannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  profileInfoContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: -34,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: KyotoMD3.primary,
    borderWidth: 3,
    borderColor: KyotoMD3.surfaceBright,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
    marginBottom: 2,
  },
  userEmailText: {
    fontSize: 12,
    color: KyotoMD3.onSurfaceVariant,
    marginBottom: 2,
  },
  userPhoneText: {
    fontSize: 11,
    color: KyotoMD3.outline,
    marginBottom: 8,
  },
  memberStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KyotoMD3.primaryContainer,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    marginTop: 6,
  },
  memberStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: KyotoMD3.primary,
    letterSpacing: 0.8,
  },
  loyaltyCard: {
    backgroundColor: KyotoMD3.surfaceBright,
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    ...Platform.select({
      android: { elevation: 2 },
    }),
  },
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  loyaltyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
  },
  loyaltySubtitle: {
    fontSize: 11,
    color: KyotoMD3.onSurfaceVariant,
    marginTop: 2,
  },
  loyaltyBadgePill: {
    backgroundColor: KyotoMD3.secondaryContainer,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  loyaltyBadgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: KyotoMD3.secondary,
  },
  stampGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  stampCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: KyotoMD3.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampCircleActive: {
    backgroundColor: KyotoMD3.primary,
  },
  stampCircleGift: {
    backgroundColor: KyotoMD3.secondary,
  },
  sectionCard: {
    backgroundColor: KyotoMD3.surfaceBright,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: KyotoMD3.outlineSubtle,
    ...Platform.select({
      android: { elevation: 1 },
    }),
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: KyotoMD3.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: KyotoMD3.onSurfaceVariant,
  },
  scanButton: {
    backgroundColor: KyotoMD3.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
  },
  scanButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  leaveButton: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
  },
  leaveButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B3261E',
  },
  cafeDetailsHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: KyotoMD3.onSurface,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 11,
    color: KyotoMD3.onSurfaceVariant,
    flex: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(179, 38, 30, 0.2)',
    backgroundColor: KyotoMD3.surfaceBright,
    marginTop: 6,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B3261E',
  },
});
