import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { CafeCard } from '@/components/common/Card';
import { CafeButton } from '@/components/common/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Elevation } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { ApiResponse } from '@/types/auth';
import { hapticFeedback } from '@/utils/haptics';

const AMBIANCE_ZONES = [
  { id: 'window', name: 'Window Bay', icon: 'sunny-outline', desc: 'Natural sunlight, view of avenue' },
  { id: 'counter', name: 'Barista Counter', icon: 'cafe-outline', desc: 'Up-close pour-over theater' },
  { id: 'patio', name: 'Garden Patio', icon: 'leaf-outline', desc: 'Fresh air, shaded greenery' },
  { id: 'lounge', name: 'Artisan Lounge', icon: 'book-outline', desc: 'Plush velvet armchairs & quiet work' },
];

const TIME_SLOTS = ['09:00', '11:30', '14:00', '16:30', '19:00', '21:00'];

export default function ReservationsModal() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('19:00');
  const [partySize, setPartySize] = useState(2);
  const [selectedZone, setSelectedZone] = useState('counter');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  // Group Bill Splitter State
  const [splitCount, setSplitCount] = useState(2);
  const [estimatedBill, setEstimatedBill] = useState(1800);

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any[]>>('/reservations');
      return res.data.data || [];
    },
  });

  const handleBookReservation = async () => {
    setIsBooking(true);
    hapticFeedback.tap();
    try {
      const payload = {
        reservationDate: `${date}T${timeSlot}:00.000Z`,
        partySize,
        specialRequests: `[Zone: ${selectedZone.toUpperCase()}] ${specialRequests.trim()}`.trim(),
      };

      const res = await apiClient.post<ApiResponse<any>>('/reservations', payload);
      if (res.data.success) {
        hapticFeedback.success();
        Alert.alert('Reservation Confirmed! 🎉', `Booked for ${partySize} guests at ${timeSlot} in the ${selectedZone.toUpperCase()} area.`);
        queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
        setSpecialRequests('');
      } else {
        Alert.alert('Booking Failed', res.data.message || 'Could not book reservation');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to book reservation');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancel = async (id: string) => {
    hapticFeedback.tap();
    try {
      await apiClient.patch(`/reservations/${id}/cancel`);
      hapticFeedback.warning();
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      Alert.alert('Cancelled', 'Reservation cancelled successfully.');
    } catch (e) {
      Alert.alert('Error', 'Failed to cancel reservation');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[Typography.editorialMedium, { color: Colors.textPrimary }]}>
          Table Seating & Reservations
        </Text>
        <Text style={[Typography.bodyMedium, { color: Colors.textSecondary, marginTop: 4 }]}>
          Select your ideal ambiance and seating zone for specialty dining
        </Text>
      </View>

      {/* Visual Interactive Floorplan & Ambiance Selector (Improvements 45 & 48) */}
      <CafeCard variant="warm" style={styles.card}>
        <Text style={styles.cardSectionTitle}>1. Choose Seating Ambiance</Text>
        <View style={styles.zonesGrid}>
          {AMBIANCE_ZONES.map((zone) => {
            const active = selectedZone === zone.id;
            return (
              <TouchableOpacity
                key={zone.id}
                style={[styles.zoneCard, active && styles.zoneCardActive]}
                onPress={() => {
                  setSelectedZone(zone.id);
                  hapticFeedback.selection();
                }}
              >
                <View style={[styles.zoneIconCircle, active && styles.zoneIconCircleActive]}>
                  <Ionicons
                    name={zone.icon as any}
                    size={20}
                    color={active ? '#FFFFFF' : Colors.uberGreen}
                  />
                </View>
                <Text style={[styles.zoneTitle, active && styles.zoneTitleActive]}>
                  {zone.name}
                </Text>
                <Text style={styles.zoneDesc}>{zone.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </CafeCard>

      {/* Date & Time Slot Grid (Improvement 47) */}
      <CafeCard variant="elevated" style={styles.card}>
        <Text style={styles.cardSectionTitle}>2. Date & Time Slot</Text>
        <View style={styles.dateSelectorRow}>
          {['Today', 'Tomorrow', 'This Friday', 'This Saturday'].map((d, index) => {
            const active = index === 0;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.dateChip, active && styles.dateChipActive]}
                onPress={() => hapticFeedback.selection()}
              >
                <Text style={[styles.dateChipText, active && styles.dateChipTextActive]}>{d}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.cardSubTitle, { marginTop: Spacing.md }]}>Available Time Slots</Text>
        <View style={styles.timeSlotsRow}>
          {TIME_SLOTS.map((slot) => {
            const active = timeSlot === slot;
            return (
              <TouchableOpacity
                key={slot}
                style={[styles.timeChip, active && styles.timeChipActive]}
                onPress={() => {
                  setTimeSlot(slot);
                  hapticFeedback.selection();
                }}
              >
                <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </CafeCard>

      {/* Party Size Stepper (Improvement 48) */}
      <CafeCard variant="elevated" style={styles.card}>
        <View style={styles.partyRow}>
          <View>
            <Text style={styles.cardSectionTitle}>3. Party Size</Text>
            <Text style={[Typography.bodySmall, { color: Colors.textMuted }]}>
              Number of guests attending
            </Text>
          </View>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => {
                if (partySize > 1) {
                  setPartySize((p) => p - 1);
                  hapticFeedback.tap();
                }
              }}
            >
              <Ionicons name="remove" size={18} color={Colors.uberBlack} />
            </TouchableOpacity>
            <Text style={styles.partyCountText}>{partySize} Guests</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => {
                if (partySize < 12) {
                  setPartySize((p) => p + 1);
                  hapticFeedback.tap();
                }
              }}
            >
              <Ionicons name="add" size={18} color={Colors.uberBlack} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Special Requests */}
        <TextInput
          style={styles.notesInput}
          placeholder="Special requests (e.g. Birthday candles, quiet corner, baby chair)..."
          placeholderTextColor={Colors.textMuted}
          value={specialRequests}
          onChangeText={setSpecialRequests}
          maxLength={150}
        />

        <CafeButton
          title={isBooking ? 'Securing Table...' : `Confirm Reservation • ${partySize} Guests`}
          onPress={handleBookReservation}
          loading={isBooking}
          style={{ marginTop: Spacing.base }}
        />
      </CafeCard>

      {/* Active Table Session Group Bill Splitter (Improvement 50) */}
      <CafeCard variant="warm" style={styles.card}>
        <View style={styles.splitterHeader}>
          <Ionicons name="calculator-outline" size={22} color={Colors.uberGreen} />
          <Text style={[styles.cardSectionTitle, { marginLeft: 8, marginBottom: 0 }]}>
            Group Bill Splitter Tool
          </Text>
        </View>
        <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 4 }]}>
          Estimate per-person share for table dining
        </Text>

        <View style={styles.splitterRow}>
          <View style={styles.splitterCol}>
            <Text style={styles.splitterLabel}>Estimated Total</Text>
            <TextInput
              style={styles.splitterInput}
              keyboardType="numeric"
              value={estimatedBill.toString()}
              onChangeText={(t) => setEstimatedBill(parseInt(t, 10) || 0)}
            />
          </View>
          <View style={styles.splitterCol}>
            <Text style={styles.splitterLabel}>Split Between</Text>
            <View style={styles.splitControls}>
              <TouchableOpacity
                onPress={() => {
                  if (splitCount > 1) setSplitCount((c) => c - 1);
                }}
                style={styles.splitMiniBtn}
              >
                <Ionicons name="remove" size={14} color="#000" />
              </TouchableOpacity>
              <Text style={styles.splitCountText}>{splitCount} people</Text>
              <TouchableOpacity
                onPress={() => setSplitCount((c) => c + 1)}
                style={styles.splitMiniBtn}
              >
                <Ionicons name="add" size={14} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.splitResultBanner}>
          <Text style={styles.splitResultLabel}>Per Person Share:</Text>
          <Text style={styles.splitResultAmount}>
            ₹{Math.round(estimatedBill / (splitCount || 1))}
          </Text>
        </View>
      </CafeCard>

      {/* Existing Reservations (Improvement 49 - Digital Pass Cards) */}
      <View style={{ marginTop: Spacing.base }}>
        <Text style={[Typography.h3, { marginBottom: Spacing.md, color: Colors.textPrimary }]}>
          Your Active Table Passes
        </Text>

        {isLoading ? (
          <Text style={[Typography.bodyMedium, { color: Colors.textMuted }]}>Loading passes...</Text>
        ) : !reservations || reservations.length === 0 ? (
          <CafeCard variant="flat" style={{ alignItems: 'center', padding: Spacing.xl }}>
            <Ionicons name="ticket-outline" size={36} color={Colors.textMuted} />
            <Text style={[Typography.bodyMedium, { color: Colors.textMuted, marginTop: 8 }]}>
              No active reservations yet. Book your table above!
            </Text>
          </CafeCard>
        ) : (
          reservations.map((r: any) => {
            const isCancelled = r.status === 'CANCELLED';
            const dateStr = new Date(r.reservationDate).toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <CafeCard key={r.id} variant="elevated" style={styles.passCard}>
                <View style={styles.passHeader}>
                  <View style={styles.passBadge}>
                    <Text style={styles.passBadgeText}>{r.status}</Text>
                  </View>
                  {!isCancelled ? (
                    <TouchableOpacity onPress={() => handleCancel(r.id)}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <Text style={[Typography.h2, { color: Colors.textPrimary, marginTop: 6 }]}>
                  {r.partySize} Guests Pass
                </Text>
                <Text style={[Typography.bodyMedium, { color: Colors.textSecondary, marginTop: 2 }]}>
                  📅 {dateStr}
                </Text>
                {r.specialRequests ? (
                  <Text style={[Typography.bodySmall, { color: Colors.textMuted, marginTop: 4 }]}>
                    Notes: {r.specialRequests}
                  </Text>
                ) : null}
              </CafeCard>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 60,
  },
  header: {
    marginBottom: Spacing.base,
  },
  card: {
    marginBottom: Spacing.base,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  cardSubTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  zonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  zoneCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  zoneCardActive: {
    borderColor: Colors.uberGreen,
    backgroundColor: '#E8F8F0',
  },
  zoneIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  zoneIconCircleActive: {
    backgroundColor: Colors.uberGreen,
  },
  zoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  zoneTitleActive: {
    color: Colors.uberGreenDark,
  },
  zoneDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  dateChipActive: {
    backgroundColor: Colors.uberGreen,
    borderColor: Colors.uberGreen,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dateChipTextActive: {
    color: '#FFFFFF',
  },
  timeSlotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  timeChipActive: {
    borderColor: Colors.uberGreen,
    backgroundColor: '#E8F8F0',
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  timeChipTextActive: {
    color: Colors.uberGreenDark,
    fontWeight: '700',
  },
  partyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    height: 40,
  },
  stepBtn: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 70,
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  splitterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitterRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.md,
  },
  splitterCol: {
    flex: 1,
  },
  splitterLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  splitterInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: 8,
    fontSize: 14,
    fontWeight: '700',
  },
  splitControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    height: 40,
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  splitMiniBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
  },
  splitCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  splitResultBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    padding: 12,
    borderRadius: Radius.sm,
    marginTop: Spacing.md,
  },
  splitResultLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.uberGreenDark,
  },
  splitResultAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.uberGreenDark,
  },
  passCard: {
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.uberGreen,
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passBadge: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  passBadgeText: {
    color: Colors.uberGreenDark,
    fontSize: 11,
    fontWeight: '700',
  },
  cancelText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
});
