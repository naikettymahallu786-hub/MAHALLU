import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
        // Clear API client tokens
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      setTokens: (tokens) => set({ tokens }),
    }),
    {
      name: 'mahallu-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
