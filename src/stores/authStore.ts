import { create } from 'zustand';
import { Storage } from '@/utils/storage';
import { apiClient } from '@/api/client';
import { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  checkAuth: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setAuth: async (user: User, accessToken: string, refreshToken: string) => {
    await Storage.setAccessToken(accessToken);
    await Storage.setRefreshToken(refreshToken);
    set({ user, isAuthenticated: true, isLoading: false, error: null });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const accessToken = await Storage.getAccessToken();
      if (!accessToken) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return false;
      }

      const response = await apiClient.get<any>('/auth/me');
      const user = response.data.user || response.data.data;
      if (user) {
        set({ user, isAuthenticated: true, isLoading: false });
        return true;
      }

      set({ user: null, isAuthenticated: false, isLoading: false });
      return false;
    } catch (e) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      const refreshToken = await Storage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
      }
    } finally {
      await Storage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  clearError: () => set({ error: null }),
}));
