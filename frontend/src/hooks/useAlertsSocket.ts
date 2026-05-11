"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useAlertStore } from "@/store/alertStore";
import { refreshToken } from "@/lib/axios";

export default function useAlertsSocket() {
  const { accessToken, user, _hasHydrated } = useAuthStore();
  const { addAlert } = useAlertStore();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!accessToken || !user || socketRef.current?.readyState === WebSocket.OPEN) return;

    const baseUrl = (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000").replace(/\/$/, "");
    const wsPath = baseUrl.endsWith("/ws") ? "/alerts/" : "/ws/alerts/";
    const wsUrl = `${baseUrl}${wsPath}?token=${encodeURIComponent(accessToken)}`;

    console.log("Alert System: Establishing emergency link...");
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Alert System: Emergency link active");
      // 🔥 INITIAL SYNC: Catch every incident that happened before the live signal
      useAlertStore.getState().syncAlerts();
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const alertData = payload.data;
        
        if (alertData?.id) {
          if (payload.event === "ALERT_RESOLVED") {
            // 🔥 Master Sync: Remove alert when resolved
            const { removeAlert } = useAlertStore.getState();
            removeAlert(alertData.id);
            console.log(`Alert System: Incident ${alertData.id} resolved.`);
          } else if (payload.event === "ALERT_CREATED") {
            // 🔥 Master Sync: Add/Update active alert
            addAlert(alertData);
          }
        }
      } catch (e) {
        console.error("Alert System: Signal noise detected", e);
      }
    };

    socket.onclose = async (e) => {
      if (e.code !== 1000) {
        console.warn("Alert System: Link severed. Reconnecting...");
      }
      
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      
      // 🛡️ STOP THE LOOP: Use a 10s safety window for recovery
      const delay = e.code === 1006 ? 10000 : 5000;

      reconnectTimeoutRef.current = setTimeout(() => {
        if (accessToken && user) {
          connect();
        }
      }, delay);

    };

    socket.onerror = () => {
      socketRef.current?.close();
    };
  }, [accessToken, user, addAlert]);

  useEffect(() => {
    if (_hasHydrated && accessToken && user) {
      connect();
    } else {
      if (socketRef.current) {
        socketRef.current.close();
      }
    }

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [_hasHydrated, accessToken, user, connect]);

  return null; // This is a logic-only hook for global listener
}
