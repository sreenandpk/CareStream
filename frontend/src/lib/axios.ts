import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/",
    withCredentials: true, // Crucial for refresh cookies
});

// Flag to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue: any[] = [];
let refreshCooldown = false;

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.request.use(
    (config) => {
        const state = useAuthStore.getState();
        const token = state.accessToken;
        const hasHydrated = state._hasHydrated;

        // If we haven't hydrated yet, the token might still be null 
        // even if the user has a valid session in localStorage.
        if (!hasHydrated && !token) {
            console.warn("Axios: Request issued before hydration was complete. Initializing session drift protection.");
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const refreshToken = async () => {
    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        });
    }

    if (refreshCooldown) return null;

    isRefreshing = true;
    try {
        const res = await axios.post(
            `${api.defaults.baseURL}accounts/refresh/`,
            {},
            { withCredentials: true }
        );

        const { access } = res.data.data;
        useAuthStore.getState().setAccessToken(access);
        processQueue(null, access);
        return access;
    } catch (refreshError: any) {
        const status = refreshError.response?.status;
        
        if (status === 429) {
            refreshCooldown = true;
            setTimeout(() => { refreshCooldown = false; }, 5000);
        }

        processQueue(refreshError, null);
        
        if (status === 401 || status === 400) {
            useAuthStore.getState().logout();
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
        }
        throw refreshError;
    } finally {
        isRefreshing = false;
    }
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isAuthError = error.response?.status === 401 || error.response?.status === 403;

        if (isAuthError && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const access = await refreshToken();
                if (access) {
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return api(originalRequest);
                }
            } catch (e) {
                return Promise.reject(e);
            }
        }
        return Promise.reject(error);
    }
);

export default api;