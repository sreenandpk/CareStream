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

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 or 403 and not already retried
        const isAuthError = error.response?.status === 401 || error.response?.status === 403;

        if (isAuthError && !originalRequest._retry) {
            // If we are currently rate limited, don't even try to refresh
            if (refreshCooldown) {
                console.warn("Axios: Refresh is on cooldown due to rate limiting. Rejecting request.");
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call the refresh endpoint (which reads the 'refresh' cookie)
                const res = await axios.post(
                    `${api.defaults.baseURL}accounts/refresh/`,
                    {},
                    { withCredentials: true }
                );

                const { access } = res.data.data;
                useAuthStore.getState().setAccessToken(access);
                
                processQueue(null, access);
                
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);
            } catch (refreshError: any) {
                const status = refreshError.response?.status;
                
                if (status === 429) {
                    console.error("Axios: Token refresh rate limited (429). Triggering 5s cooldown.");
                    refreshCooldown = true;
                    setTimeout(() => { 
                        refreshCooldown = false; 
                        console.log("Axios: Refresh cooldown ended.");
                    }, 5000);
                }

                processQueue(refreshError, null);
                
                // ONLY force logout if the session is truly dead
                // 401 (Unauthorized) and 400 (Bad Request/Invalid Token) from the refresh endpoint are fatal.
                const isFatalAuthError = status === 401 || status === 400;

                if (isFatalAuthError) {
                    console.error("Axios: Session expired or invalid (400/401), logging out...");
                    useAuthStore.getState().logout();
                    if (typeof window !== "undefined") {
                        window.location.href = "/login";
                    }
                } else {
                    console.error(`Axios: Token refresh failed (Status: ${status}), preserving session for retry later.`);
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;