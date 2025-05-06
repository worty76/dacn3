import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";

interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
  setIsAuthenticated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
        Cookies.set(
          "auth-storage",
          encodeURIComponent(
            JSON.stringify({
              state: {
                isAdmin: user.isAdmin,
                isAuthenticated: true,
                token,
              },
            })
          ),
          { expires: 7 }
        );
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        Cookies.remove("auth-storage");
      },
      isAdmin: () => get().user?.isAdmin || false,
      setIsAuthenticated: (value) => set({ isAuthenticated: value }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAdmin = () => useAuthStore((state) => state.isAdmin());
