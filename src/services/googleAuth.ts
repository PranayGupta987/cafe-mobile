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
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '435112311982-k7jbtohlcicukm0vcvpv80c56gk65e83.apps.googleusercontent.com',
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '435112311982-k7jbtohlcicukm0vcvpv80c56gk65e83.apps.googleusercontent.com',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '435112311982-k7jbtohlcicukm0vcvpv80c56gk65e83.apps.googleusercontent.com',
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

export function getGoogleRedirectUri(clientId: string): string {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    const rawId = clientId.replace('.apps.googleusercontent.com', '');
    return `com.googleusercontent.apps.${rawId}:/oauth2redirect`;
  }
  return AuthSession.makeRedirectUri({ scheme: 'cafeapp' });
}

export interface GoogleAuthResult {
  success: boolean;
  user?: any;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

/**
 * Initiates the Google OAuth 2.0 flow using Expo AuthSession / WebBrowser with Authorization Code + PKCE
 */
export async function promptGoogleAuth(): Promise<GoogleAuthResult> {
  const clientId = getEffectiveClientId();
  const redirectUri = getGoogleRedirectUri(clientId);

  if (!clientId) {
    return {
      success: false,
      error: 'Google OAuth Client ID is not configured. Please set EXPO_PUBLIC_GOOGLE_CLIENT_ID.',
    };
  }

  try {
    // Generate auth request with Authorization Code + PKCE
    const authRequest = new AuthSession.AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      redirectUri,
      usePKCE: true,
    });

    const result = await authRequest.promptAsync(googleDiscovery);

    if (result.type === 'success' && result.params) {
      let idToken: string | undefined = result.params.id_token;
      let accessToken: string | undefined = result.params.access_token;

      // If we received an authorization code, exchange it via PKCE
      if (result.params.code) {
        try {
          const tokenResult = await AuthSession.exchangeCodeAsync(
            {
              clientId,
              code: result.params.code,
              redirectUri,
              extraParams: {
                code_verifier: authRequest.codeVerifier || '',
              },
            },
            googleDiscovery
          );
          if (tokenResult.idToken) idToken = tokenResult.idToken;
          if (tokenResult.accessToken) accessToken = tokenResult.accessToken;
        } catch (exchangeErr) {
          console.error('Code exchange error:', exchangeErr);
        }
      }

      if (!idToken && !accessToken) {
        return {
          success: false,
          error: 'Failed to retrieve Google authentication tokens',
        };
      }

      // Exchange with backend
      const response = await apiClient.post<any>('/auth/google', {
        idToken: idToken || '',
        accessToken: accessToken || '',
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
