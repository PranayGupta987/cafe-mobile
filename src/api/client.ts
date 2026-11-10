import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Storage } from '@/utils/storage';
import { extractAuthPayload, ApiResponse } from '@/types/auth';

export const API_BASE_URL = 'https://cafeapp-backend-sgj7.onrender.com/api/v1';
export const SOCKET_URL = 'https://cafeapp-backend-sgj7.onrender.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await Storage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Mutex Token Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<any>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Do not attempt to refresh on auth login/register endpoints
    if (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await Storage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Explicit refresh call without using apiClient to avoid interceptor recursion
      const refreshResponse = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const payload = extractAuthPayload(refreshResponse.data);
      if (!payload?.accessToken) {
        throw new Error('Refresh token rejected');
      }

      await Storage.setAccessToken(payload.accessToken);
      if (payload.refreshToken) {
        await Storage.setRefreshToken(payload.refreshToken);
      }

      processQueue(null, payload.accessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${payload.accessToken}`;
      }

      return apiClient(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      await Storage.clearTokens();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);
