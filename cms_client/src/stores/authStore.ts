import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResult } from '../api/auth';
import { login as apiLogin, refresh as apiRefresh } from '../api/auth';
import type { User } from '../types';
import { clearTokens, getRefreshToken, setTokens } from '../utils/auth';

interface AuthState {
  user: User | null;
  isAuthed: boolean;
  ready: boolean;
  bootstrapped: boolean;
  login: (email: string, password: string) => Promise<void>;
  applyAuth: (payload: AuthResult) => void;
  logout: () => void;
  setUser: (u: User) => void;
  bootstrap: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthed: false,
      ready: false,
      bootstrapped: false,

      async login(email: string, password: string) {
        const res: AuthResult = await apiLogin({ email, password });
        setTokens({
          access_token: res.access_token,
          refresh_token: res.refresh_token,
        });
        set({ user: res.user, isAuthed: true });
      },

      applyAuth(res) {
        setTokens({
          access_token: res.access_token,
          refresh_token: res.refresh_token,
        });
        set({ user: res.user, isAuthed: true });
      },

      logout() {
        clearTokens();
        try {
          import('./ticketStore').then(({ useTicketStore }) => {
            (useTicketStore.getState() as { reset: () => void }).reset();
          });
        } catch {
          /* ignore */
        }
        set({ user: null, isAuthed: false });
      },

      setUser(u: User) {
        set({ user: u, isAuthed: true });
      },

      async bootstrap() {
        if (get().bootstrapped) {
          if (!get().ready) set({ ready: true });
          return;
        }
        set({ bootstrapped: true });

        const refresh = getRefreshToken();
        if (!refresh) {
          set({ ready: true });
          return;
        }

        try {
          const tokens = await apiRefresh(refresh);
          setTokens(tokens);
          set({ isAuthed: true });
        } catch {
          clearTokens();
          set({ user: null, isAuthed: false });
        } finally {
          set({ ready: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ user: s.user, isAuthed: s.isAuthed }),
    },
  ),
);
