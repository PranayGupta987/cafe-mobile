import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { CafeCard } from '@/components/common/Card';
import { CafeButton } from '@/components/common/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { ApiResponse } from '@/types/auth';

export default function ReservationsModal() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('19:00');
  const [partySize, setPartySize] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any[]>>('/reservations');
      return res.data.data || [];
    },
  });

  const handleBookReservation = async () => {
    setIsBooking(true);
    try {
      const payload = {
        reservationDate: `${date}T${timeSlot}:00.000Z`,
        partySize,
        specialRequests: specialRequests.trim() || undefined,
      };

      const res = await apiClient.post<ApiResponse<any>>('/reservations', payload);
      if (res.data.success) {
        Alert.alert('Success', 'Table reservation booked successfully!');
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
    try {
      await apiClient.patch(`/reservations/${id}/cancel`);
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      Alert.alert('Cancelled', 'Reservation cancelled successfully.');
    } catch (e) {
      Alert.alert('Error', 'Failed to cancel reservation');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Book New Reservation */}
      <CafeCard variant="elevated" style={styles.card}>
        <Text style={[Typography.h3, { marginBottom: Spacing.base }]}>Book a Table</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="2026-11-12"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Time Slot (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={timeSlot}
            onChangeText={setTimeSlot}
            placeholder="19:00"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Party Size: {partySize} Guests</Text>
          <View style={styles.partyRow}>
            {[1, 2, 4, 6, 8].map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.partyChip, partySize === size && styles.partyChipActive]}
                onPress={() => setPartySize(size)}
              >
                <Text
                  style={[styles.partyChipText, partySize === size && styles.partyChipTextActive]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Special Requests (Optional)</Text>
          <TextInput
            style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
            value={specialRequests}
            onChangeText={setSpecialRequests}
            placeholder="Anniversary setup, high chair..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />
        </View>

        <CafeButton
          title="Confirm Reservation"
          loading={isBooking}
          onPress={handleBookReservation}
          style={{ marginTop: Spacing.sm }}
        />
      </CafeCard>

      {/* Existing Reservations */}
      <Text style={[Typography.h3, { marginVertical: Spacing.base }]}>Your Reservations</Text>

      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.cafeBrown} />
      ) : !reservations || reservations.length === 0 ? (
        <Text style={[Typography.bodyMedium, { color: Colors.textMuted }]}>
          No reservations found
        </Text>
      ) : (
        reservations.map((item) => {
          const dateFormatted = new Date(item.reservationDate).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          });

          return (
            <CafeCard key={item.id} variant="elevated" style={styles.reservationCard}>
              <View style={styles.resRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.titleMedium, { color: Colors.textPrimary }]}>
                    Table for {item.partySize} Guests
                  </Text>
                  <Text style={[Typography.bodyMedium, { color: Colors.cafeBrown, marginTop: 2 }]}>
                    {dateFormatted}
                  </Text>
                  <Text
                    style={[
                      Typography.labelSmall,
                      {
                        color:
                          item.status === 'CONFIRMED'
                            ? Colors.success
                            : item.status === 'CANCELLED'
                            ? Colors.error
                            : Colors.cafeGoldDark,
                        marginTop: 4,
                      },
                    ]}
                  >
                    STATUS: {item.status}
                  </Text>
                </View>

                {item.status === 'CONFIRMED' ? (
                  <CafeButton
                    title="Cancel"
                    variant="danger"
                    size="sm"
                    onPress={() => handleCancel(item.id)}
                  />
                ) : null}
              </View>
            </CafeCard>
          );
        })
      )}
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
  card: {
    marginBottom: Spacing.base,
  },
  inputGroup: {
    marginBottom: Spacing.base,
  },
  label: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    height: 42,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  partyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  partyChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    marginHorizontal: 4,
  },
  partyChipActive: {
    backgroundColor: Colors.cafeBrown,
    borderColor: Colors.cafeBrown,
  },
  partyChipText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  partyChipTextActive: {
    color: '#FFFFFF',
  },
  reservationCard: {
    marginBottom: Spacing.sm,
  },
  resRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
