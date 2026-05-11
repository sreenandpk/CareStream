"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { usePresenceStore } from "@/store/presenceStore";
import api from "@/lib/axios";

export default function PresenceManager() {
    const { accessToken, user, _hasHydrated } = useAuthStore();
    const { setOnlineUsers, updateUserStatus, clearOnlineUsers } = usePresenceStore();
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Initial Synchronous Seed
    useEffect(() => {
        if (!_hasHydrated || !accessToken || !user) {
            clearOnlineUsers();
            return;
        }

        const fetchOnlineUsers = async () => {
            // Stability Buffer: Wait a micro-moment to ensure state is settled
            await new Promise(resolve => setTimeout(resolve, 150));

            try {
                const res = await api.get("accounts/online-users/");
                const sessionData = res.data.online_users;
                if (Array.isArray(sessionData)) {
                    // Extract IDs of staff members with active sessions, ensuring Number type
                    const ids = sessionData.map((s: any) => Number(s.user)).filter(id => !isNaN(id));
                    setOnlineUsers(ids);
                }
            } catch (err) {
                console.error("Presence Manager: Failed initial sync", err);
            }
        };

        fetchOnlineUsers();
    }, [_hasHydrated, accessToken, user, setOnlineUsers, clearOnlineUsers]);

    // 2. Real-time WebSocket Life-cycle
    useEffect(() => {
        if (!_hasHydrated || !accessToken || !user) {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
            return;
        }

        const connect = () => {
            if (!accessToken) return;

            const baseUrl = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000').replace(/\/$/, "");
            const wsPath = baseUrl.endsWith("/ws") ? "/status/" : "/ws/status/";
            const wsUrl = `${baseUrl}${wsPath}?token=${encodeURIComponent(accessToken)}`;

            console.log("Presence Manager: Connecting to status network...");
            const socket = new WebSocket(wsUrl);
            socketRef.current = socket;

            socket.onopen = () => {
                console.log("Presence Manager: Connected to status network");
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === "presence_sync") {
                        console.log("Presence Manager: Received master sync", data.online_user_ids);
                        setOnlineUsers(data.online_user_ids.map(Number));
                    }
                    else if (data.type === "status_update") {
                        updateUserStatus(
                            Number(data.user_id), 
                            data.status, 
                            data.last_login,
                            data.email 
                        );
                    }
                } catch (e) {
                    console.error("Presence Manager: Error parsing status message", e);
                }
            };

            socket.onclose = (e) => {
                console.log(`Presence Manager: Disconnected (Code ${e.code}). Validating session...`);

                // 🛡️ STOP THE LOOP: If we've had a WebSocket error or sudden close, wait longer
                if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

                const delay = e.code === 1006 ? 10000 : 5000; // 10s delay if abnormal, 5s otherwise

                reconnectTimeoutRef.current = setTimeout(() => {
                    if (accessToken && user) {
                        // Check if session is still alive before blind reconnect
                        api.get("accounts/online-users/").then(() => {
                             connect();
                        }).catch((err) => {
                             console.warn("Presence Manager: Session invalid. Awaiting auth cycle.");
                        });
                    }
                }, delay); 
            };


            socket.onerror = (err) => {
                console.error("Presence Manager: WebSocket error. Closing to trigger reconnection...");
                socket.close();
            };
        };

        connect();

        return () => {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [_hasHydrated, accessToken, user, updateUserStatus]);

    // This is a logic-only component
    return null;
}
