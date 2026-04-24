import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
    id: number;
    username: string;
    role: "ADMIN" | "DOCTOR" | "NURSE";
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    _hasHydrated: boolean;
    setAuth: (user: User, accessToken: string) => void;
    setAccessToken: (accessToken: string) => void;
    setHasHydrated: (state: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            _hasHydrated: false,
            setAuth: (user, accessToken) => set({ user, accessToken }),
            setAccessToken: (accessToken) => set({ accessToken }),
            setHasHydrated: (state) => set({ _hasHydrated: state }),
            logout: () => {
                set({ user: null, accessToken: null });
                localStorage.removeItem("auth-storage");
            },
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
