import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import { CafeButton } from '@/components/common/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Elevation } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { extractAuthPayload, extractErrorMessage } from '@/types/auth';
import { hapticFeedback } from '@/utils/haptics';

export default function RegisterScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password Strength Calculation (Improvement 56)
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: '', color: Colors.border };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: '#E11900' };
    if (score === 2) return { score: 2, label: 'Fair', color: '#FF9500' };
    if (score === 3) return { score: 3, label: 'Good', color: '#34A853' };
    return { score: 4, label: 'Strong', color: Colors.uberGreen };
  };

  const strength = getPasswordStrength();

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedEmail || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError(null);
    hapticFeedback.tap();

    try {
      const response = await apiClient.post<any>('/auth/register', {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone || undefined,
        password,
      });

      const payload = extractAuthPayload(response.data);
      if (payload) {
        hapticFeedback.success();
        await setAuth(payload.user, payload.accessToken, payload.refreshToken);
        router.replace('/(tabs)/home');
      } else {
        hapticFeedback.error();
        setError(response.data?.message || 'Registration failed');
      }
    } catch (err: any) {
      hapticFeedback.error();
      setError(extractErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[Typography.editorialLarge, styles.title]}>Create Account</Text>
          <Text style={[Typography.bodyMedium, styles.subtitle]}>
            Join our coffee community for exclusive reservations & perks
          </Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Alex Morgan"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              placeholderTextColor={Colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password * (min. 8 characters)</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Multi-Segment Password Strength Meter (Improvement 56) */}
            {password.length > 0 ? (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBarsRow}>
                  {[1, 2, 3, 4].map((step) => (
                    <View
                      key={step}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            step <= strength.score ? strength.color : '#E0E0E0',
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            ) : null}
          </View>

          <CafeButton
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitButton}
          />

          <View style={styles.footerRow}>
            <Text style={[Typography.bodyMedium, { color: Colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[Typography.labelLarge, { color: Colors.uberGreenDark }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  headerContainer: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Elevation.sm,
  },
  title: {
    color: Colors.textPrimary,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    color: Colors.error,
    marginLeft: Spacing.sm,
    flex: 1,
    ...Typography.bodyMedium,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Elevation.sm,
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
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  eyeIcon: {
    padding: Spacing.md,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  strengthBarsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    marginRight: 10,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
});
