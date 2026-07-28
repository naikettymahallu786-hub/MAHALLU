import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthTokens } from '@mahallu/shared-types';

interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  tenantId: string;
  avatar?: string;
  twoFactorEnabled?: boolean;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setTokens: (tokens: AuthTokens) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,

      login: (user, tokens) =>
        set({ user, tokens, isAuthenticated: true }),

      logout: () => {
        set({ user: null, tokens: null, isAuthenticated: false });
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      setTokens: (tokens) => set({ tokens }),
    }),
    {
      name: 'mahallu-mobile-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
