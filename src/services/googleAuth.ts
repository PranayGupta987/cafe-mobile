import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import { apiClient } from '@/api/client';
import { extractAuthPayload, extractErrorMessage } from '@/types/auth';
import { Storage } from '@/utils/storage';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth Discovery Endpoints
export const googleDiscovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// Configurable Google Client IDs
export const GOOGLE_CONFIG = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
};

export function getEffectiveClientId(): string {
  if (Platform.OS === 'android' && GOOGLE_CONFIG.androidClientId) {
    return GOOGLE_CONFIG.androidClientId;
  }
  if (Platform.OS === 'ios' && GOOGLE_CONFIG.iosClientId) {
    return GOOGLE_CONFIG.iosClientId;
  }
  return GOOGLE_CONFIG.webClientId || GOOGLE_CONFIG.androidClientId || GOOGLE_CONFIG.iosClientId;
}

export interface GoogleAuthResult {
  success: boolean;
  user?: any;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

/**
 * Initiates the Google OAuth 2.0 flow using Expo AuthSession / WebBrowser
 */
export async function promptGoogleAuth(): Promise<GoogleAuthResult> {
  const clientId = getEffectiveClientId();
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'cafeapp',
  });

  if (!clientId) {
    return {
      success: false,
      error: 'Google OAuth Client ID is not configured. Please set EXPO_PUBLIC_GOOGLE_CLIENT_ID.',
    };
  }

  try {
    // Generate auth request
    const authRequest = new AuthSession.AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      redirectUri,
    });

    const result = await authRequest.promptAsync(googleDiscovery);

    if (result.type === 'success' && result.params) {
      const { access_token, id_token } = result.params;

      // Exchange with backend
      const response = await apiClient.post<any>('/auth/google', {
        idToken: id_token,
        accessToken: access_token,
      });

      const payload = extractAuthPayload(response.data);
      if (payload) {
        await Storage.setAccessToken(payload.accessToken);
        if (payload.refreshToken) {
          await Storage.setRefreshToken(payload.refreshToken);
        }

        return {
          success: true,
          user: payload.user,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken || '',
        };
      }

      return {
        success: false,
        error: response.data?.message || 'Google authentication failed',
      };
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      return {
        success: false,
        error: 'Sign in was cancelled',
      };
    }

    return {
      success: false,
      error: 'Unable to authenticate with Google',
    };
  } catch (err: any) {
    return {
      success: false,
      error: extractErrorMessage(err, 'Google Sign-In failed'),
    };
  }
}
