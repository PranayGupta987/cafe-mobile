import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { CafeCard } from '@/components/common/Card';
import { CafeButton } from '@/components/common/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Elevation } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { hapticFeedback } from '@/utils/haptics';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { tableNumber, setTable, clearCart } = useCartStore();

  // Loyalty Card Stamps State (Improvement 58)
  const [stamps] = useState(6);
  const totalStamps = 8;

  const handleLeaveTable = () => {
    hapticFeedback.warning();
    Alert.alert(
      'Leave Table',
      `Are you sure you want to release Table ${tableNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Table',
          style: 'destructive',
          onPress: () => {
            setTable(null, null);
            hapticFeedback.tap();
            Alert.alert('Table Released', 'You have checked out of your table session.');
          },
        },
      ]
    );
  };

  const handleStampClaim = () => {
    hapticFeedback.tap();
    Alert.alert(
      'Artisanal Loyalty Club',
      `You currently have ${stamps} of ${totalStamps} stamps! Collect ${totalStamps - stamps} more stamps on specialty pour-overs to unlock a complimentary Reserve Batch!`
    );
  };

  const handleLogout = () => {
    hapticFeedback.warning();
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* User Info Card */}
      <CafeCard variant="elevated" style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>
            {user?.name
              ? user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'U'}
          </Text>
        </View>

        <Text style={[Typography.editorialMedium, styles.userName]}>{user?.name || 'Guest Connoisseur'}</Text>
        <Text style={[Typography.bodyMedium, styles.userEmail]}>{user?.email || 'coffee.lover@artisan.com'}</Text>
        {user?.phone ? (
          <Text style={[Typography.bodySmall, styles.userPhone]}>{user.phone}</Text>
        ) : null}

        <View style={styles.roleBadge}>
          <Ionicons name="sparkles" size={12} color={Colors.uberGreenDark} style={{ marginRight: 4 }} />
          <Text style={styles.roleText}>{user?.role || 'COFFEE CLUB GOLD'}</Text>
        </View>
      </CafeCard>

      {/* Cafe Loyalty Progress Ring & Stamp Card (Improvement 58) */}
      <CafeCard variant="warm" style={styles.loyaltyCard}>
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
                  size={18}
                  color={isStamped || isFreeReward ? '#FFFFFF' : Colors.textMuted}
                />
              </View>
            );
          })}
        </View>
      </CafeCard>

      {/* Active Table Status */}
      <CafeCard variant="elevated" style={styles.sectionCard}>
        <View style={styles.sectionRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="restaurant-outline" size={24} color={Colors.uberGreenDark} />
          </View>
          <View style={styles.sectionInfo}>
            <Text style={Typography.titleMedium}>Active Table</Text>
            <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
              {tableNumber ? `Checked into Table ${tableNumber}` : 'No table assigned'}
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
      </CafeCard>

      {/* Table Reservations Shortcut */}
      <CafeCard variant="elevated" style={styles.sectionCard}>
        <TouchableOpacity
          style={styles.sectionRow}
          onPress={() => router.push('/modal/reservations')}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="calendar-outline" size={24} color={Colors.uberGreenDark} />
          </View>
          <View style={styles.sectionInfo}>
            <Text style={Typography.titleMedium}>Table Seating & Passes</Text>
            <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
              Book artisan floorplan tables and split bills
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </CafeCard>

      {/* Kitchen Switch for Staff */}
      {user?.role === 'KITCHEN' || user?.role === 'CAFE_STAFF' || user?.role === 'CAFE_ADMIN' ? (
        <CafeCard variant="elevated" style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionRow}
            onPress={() => router.push('/kitchen')}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#E8F8F0' }]}>
              <Ionicons name="desktop-outline" size={24} color={Colors.uberGreenDark} />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={Typography.titleMedium}>Kitchen Display System</Text>
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                Switch to live kitchen order fulfillment board
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </CafeCard>
      ) : null}

      {/* Cafe Information */}
      <CafeCard variant="elevated" style={styles.sectionCard}>
        <Text style={[Typography.h3, { marginBottom: Spacing.md }]}>Café Details</Text>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={18} color={Colors.uberGreenDark} />
          <Text style={[Typography.bodyMedium, styles.infoText]}>
            Open Daily: 08:00 AM – 11:00 PM
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color={Colors.uberGreenDark} />
          <Text style={[Typography.bodyMedium, styles.infoText]}>
            123 Artisanal Roastery Lane, Indiranagar, Bengaluru
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={18} color={Colors.uberGreenDark} />
          <Text style={[Typography.bodyMedium, styles.infoText]}>+91 98765 43210</Text>
        </View>
      </CafeCard>

      {/* Logout Action */}
      <View style={styles.logoutContainer}>
        <CafeButton
          title="Sign Out"
          variant="outline"
          onPress={handleLogout}
          icon={<Ionicons name="log-out-outline" size={20} color={Colors.uberGreenDark} />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 60,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.base,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.uberGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Elevation.sm,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  userName: {
    color: Colors.textPrimary,
  },
  userEmail: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    color: Colors.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  roleText: {
    ...Typography.labelSmall,
    color: Colors.uberGreenDark,
    fontWeight: '800',
  },
  loyaltyCard: {
    marginBottom: Spacing.base,
    borderWidth: 1.5,
    borderColor: Colors.uberGreen,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  loyaltyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  loyaltySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  loyaltyBadgePill: {
    backgroundColor: Colors.uberBlack,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  loyaltyBadgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stampGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  stampCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EBEBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampCircleActive: {
    backgroundColor: Colors.uberGreen,
  },
  stampCircleGift: {
    backgroundColor: '#FF9500',
  },
  sectionCard: {
    marginBottom: Spacing.base,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sectionInfo: {
    flex: 1,
  },
  scanButton: {
    backgroundColor: Colors.uberBlack,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  leaveButton: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  leaveButtonText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoText: {
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  logoutContainer: {
    marginTop: Spacing.base,
  },
});
