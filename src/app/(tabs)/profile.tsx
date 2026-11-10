import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { CafeCard } from '@/components/common/Card';
import { CafeButton } from '@/components/common/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/dimens';
import { Typography } from '@/constants/typography';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { tableNumber, setTable, clearCart } = useCartStore();

  const handleLeaveTable = () => {
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
            Alert.alert('Table Released', 'You have checked out of your table session.');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
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

        <Text style={[Typography.h2, styles.userName]}>{user?.name || 'Guest User'}</Text>
        <Text style={[Typography.bodyMedium, styles.userEmail]}>{user?.email || ''}</Text>
        {user?.phone ? (
          <Text style={[Typography.bodySmall, styles.userPhone]}>{user.phone}</Text>
        ) : null}

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role || 'CUSTOMER'}</Text>
        </View>
      </CafeCard>

      {/* Active Table Status */}
      <CafeCard variant="elevated" style={styles.sectionCard}>
        <View style={styles.sectionRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="restaurant-outline" size={24} color={Colors.cafeBrown} />
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

      {/* Kitchen Switch for Staff */}
      {user?.role === 'KITCHEN' || user?.role === 'CAFE_STAFF' || user?.role === 'CAFE_ADMIN' ? (
        <CafeCard variant="elevated" style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionRow}
            onPress={() => router.push('/kitchen')}
          >
            <View style={[styles.iconCircle, { backgroundColor: Colors.cafeGoldContainer }]}>
              <Ionicons name="desktop-outline" size={24} color={Colors.cafeGoldDark} />
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
          <Ionicons name="time-outline" size={18} color={Colors.cafeBrown} />
          <Text style={[Typography.bodyMedium, styles.infoText]}>
            Open Daily: 08:00 AM – 11:00 PM
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color={Colors.cafeBrown} />
          <Text style={[Typography.bodyMedium, styles.infoText]}>
            123 Artisanal Roastery Lane, Indiranagar, Bengaluru
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={18} color={Colors.cafeBrown} />
          <Text style={[Typography.bodyMedium, styles.infoText]}>+91 98765 43210</Text>
        </View>
      </CafeCard>

      {/* Logout Action */}
      <View style={styles.logoutContainer}>
        <CafeButton
          title="Sign Out"
          variant="outline"
          onPress={handleLogout}
          icon={<Ionicons name="log-out-outline" size={20} color={Colors.cafeBrown} />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 40,
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
    backgroundColor: Colors.cafeBrown,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
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
    backgroundColor: Colors.cafeBrownContainer,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  roleText: {
    ...Typography.labelSmall,
    color: Colors.cafeBrownDark,
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
    backgroundColor: Colors.cafeBrownContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sectionInfo: {
    flex: 1,
  },
  scanButton: {
    backgroundColor: Colors.cafeBrown,
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
    backgroundColor: Colors.errorContainer,
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
