import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthState, User } from "@/types/auth";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user: User, token: string) => {
        set({ user, token });
        // Set cookies for middleware
        document.cookie = `token=${token}; path=/`;
        document.cookie = `role=${user.role}; path=/`;
      },
      logout: () => {
        set({ user: null, token: null });
        // Clear cookies
        document.cookie =
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        document.cookie =
          "role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
