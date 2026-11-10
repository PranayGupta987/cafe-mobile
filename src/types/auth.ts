export type UserRole = 'CUSTOMER' | 'CAFE_STAFF' | 'KITCHEN' | 'CAFE_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseData {
  user: User;
  tokens: AuthTokens;
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  error?: string | {
    code?: string;
    message?: string;
    details?: { field: string; message: string }[];
  };
}

/**
 * Extracts user, accessToken, and refreshToken from backend auth responses which may be:
 * 1. Direct: { accessToken, refreshToken, user }
 * 2. Wrapped: { success: true, data: { user, tokens: { accessToken, refreshToken } } }
 * 3. Wrapped variant: { success: true, data: { user, accessToken, refreshToken } }
 */
export function extractAuthPayload(resData: any): { user: User; accessToken: string; refreshToken: string } | null {
  if (!resData) return null;

  // Direct format
  if (resData.accessToken && resData.user) {
    return {
      user: resData.user,
      accessToken: resData.accessToken,
      refreshToken: resData.refreshToken || '',
    };
  }

  // Wrapped format with tokens object
  if (resData.data?.user && resData.data?.tokens?.accessToken) {
    return {
      user: resData.data.user,
      accessToken: resData.data.tokens.accessToken,
      refreshToken: resData.data.tokens.refreshToken || '',
    };
  }

  // Wrapped format with flat tokens
  if (resData.data?.user && resData.data?.accessToken) {
    return {
      user: resData.data.user,
      accessToken: resData.data.accessToken,
      refreshToken: resData.data.refreshToken || '',
    };
  }

  return null;
}

/**
 * Extracts a user-friendly error message from Axios error response, supporting:
 * - { error: "string message" }
 * - { error: { message: "...", details: [{ field, message }] } }
 * - { message: "..." }
 * - Error objects
 */
export function extractErrorMessage(err: any, fallback: string = 'Operation failed'): string {
  if (!err) return fallback;
  const resData = err.response?.data;
  if (resData) {
    if (typeof resData.error === 'string') {
      return resData.error;
    }
    if (resData.error?.details && Array.isArray(resData.error.details) && resData.error.details.length > 0) {
      const first = resData.error.details[0];
      return first.message || `${first.field} is invalid`;
    }
    if (resData.error?.message) {
      return resData.error.message;
    }
    if (resData.message) {
      return resData.message;
    }
    if (typeof resData === 'string') {
      return resData;
    }
  }
  return err.message || fallback;
}
