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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import { CafeButton } from '@/components/common/Button';
import { GoogleSignInButton } from '@/components/common/GoogleSignInButton';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Elevation } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { extractAuthPayload, extractErrorMessage } from '@/types/auth';
import { hapticFeedback } from '@/utils/haptics';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (customEmail?: string, customPassword?: string) => {
    const finalEmail = (customEmail || email).trim().toLowerCase();
    const finalPassword = customPassword || password;

    if (!finalEmail || !finalPassword) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);
    hapticFeedback.tap();

    try {
      const response = await apiClient.post<any>('/auth/login', {
        email: finalEmail,
        password: finalPassword,
      });

      const payload = extractAuthPayload(response.data);
      if (payload) {
        hapticFeedback.success();
        await setAuth(payload.user, payload.accessToken, payload.refreshToken);
        if (payload.user.role === 'KITCHEN' || payload.user.role === 'CAFE_STAFF') {
          router.replace('/kitchen');
        } else {
          router.replace('/(tabs)/home');
        }
      } else {
        hapticFeedback.error();
        setError(response.data?.message || 'Login failed');
      }
    } catch (err: any) {
      hapticFeedback.error();
      setError(extractErrorMessage(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  // Biometric Unlock Simulation (Improvement 55)
  const handleBiometricAuth = () => {
    hapticFeedback.heavy();
    Alert.alert(
      'Biometric Quick Sign-In',
      'Use device fingerprint or Face ID to quickly authenticate with demo account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Authenticate with Face ID',
          onPress: () => {
            setEmail('customer@cafe.com');
            setPassword('Password123!');
            handleLogin('customer@cafe.com', 'Password123!');
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="cafe" size={44} color="#FFFFFF" />
          </View>
          <Text style={[Typography.editorialLarge, styles.title]}>Welcome Back</Text>
          <Text style={[Typography.bodyMedium, styles.subtitle]}>
            Sign in to experience specialty coffee & gourmet dining
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
            <Text style={styles.label}>Email Address</Text>
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
            <Text style={styles.label}>Password</Text>
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
          </View>

          <CafeButton
            title="Sign In"
            onPress={() => handleLogin()}
            loading={loading}
            style={styles.submitButton}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <GoogleSignInButton
            onSuccess={() => router.replace('/(tabs)/home')}
            onError={(msg) => setError(msg)}
            style={styles.googleBtn}
          />

          {/* Biometric Quick Login Shortcut (Improvement 55) */}
          <TouchableOpacity
            style={styles.biometricBtn}
            onPress={handleBiometricAuth}
            activeOpacity={0.8}
          >
            <Ionicons name="finger-print-outline" size={24} color={Colors.uberGreenDark} />
            <Text style={styles.biometricText}>Quick Sign-In with Biometrics</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={[Typography.bodyMedium, { color: Colors.textSecondary }]}>
              Don&apos;t have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={[Typography.labelLarge, { color: Colors.uberGreenDark }]}>Register</Text>
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
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.uberGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
    ...Elevation.md,
  },
  title: {
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    maxWidth: 280,
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
  submitButton: {
    marginTop: Spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.base,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  googleBtn: {
    marginBottom: Spacing.sm,
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.uberGreen,
    backgroundColor: '#E8F8F0',
    gap: 8,
  },
  biometricText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.uberGreenDark,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
});
