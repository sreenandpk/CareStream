"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

export interface VitalData {
  device: {
    id: number;
    serial: string;
    label: string | null;
    mode: "REAL" | "SIMULATION";
    state: "LIVE" | "DELAYED" | "OFFLINE";
    last_seen: string;
  };
  patient: {
    id: number | null;
    name: string | null;
    location: string;
    ward_id: number | null;
  };
  vitals: {
    heart_rate: number;
    spo2: number;
    respiratory_rate: number;
    temperature: number;
    bp: string;
    timestamp: string;
  };
  waveform?: {
    ecg: number[];
    spo2: number[];
    resp: number[];
  };
  // 🏥 HIERARCHICAL METADATA (For Dashboard Routing/Filtering)
  ward_id?: number;
  room_id?: number;
  bed_id?: number;
}

export default function useVitalsSocket(initialData: VitalData[] = []) {
  const { accessToken, user, _hasHydrated } = useAuthStore();

  const [vitals, setVitals] = useState<Record<string, VitalData>>(() => {
    const initialMap: Record<string, VitalData> = {};
    initialData.forEach(v => initialMap[v.device.serial] = v);
    return initialMap;
  });

  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!accessToken || !user || socketRef.current?.readyState === WebSocket.OPEN) return;

    const baseUrl = (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000").replace(/\/$/, "");

    const path = baseUrl.endsWith("/ws") ? "/vitals/" : "/ws/vitals/";
    const wsUrl = `${baseUrl}${path}?token=${encodeURIComponent(accessToken)}`;

    console.log("Telemetry Gateway: Establishing secure link...");
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Telemetry Gateway: Link secured.");
      setConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.event === "VITAL_UPDATE") {
          const data = payload.data as VitalData;
          setVitals((prev) => {
            const serial = data.device.serial;
            const existing = prev[serial];

            // 🛡️ DEDUPLICATION GUARD: Prevent signal jumps/reset
            if (existing?.vitals?.timestamp && data.vitals?.timestamp) {
              const existingTime = new Date(existing.vitals.timestamp).getTime();
              const incomingTime = new Date(data.vitals.timestamp).getTime();
              if (incomingTime <= existingTime) return prev;
            }

            return {
              ...prev,
              [serial]: {
                ...(prev[serial] || {}),
                ...data,
                device: { ...(prev[serial]?.device || {}), ...data.device },
                patient: { ...(prev[serial]?.patient || {}), ...data.patient },
                vitals: { ...(prev[serial]?.vitals || {}), ...data.vitals },
              }
            };
          });
        }
      } catch (e) {
        console.error("Telemetry Gateway: Data frame corruption", e);
      }
    };

    socket.onclose = (e) => {
      console.warn(`Telemetry Gateway: Link severed (Code ${e.code}). Recovery initiated...`);
      setConnected(false);

      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (accessToken && user) connect();
      }, 3000);
    };

    socket.onerror = () => setConnected(false);
  }, [accessToken, user]);

  useEffect(() => {
    if (_hasHydrated && accessToken && user) {
      connect();
    }
  }, [_hasHydrated, accessToken, user, connect]);

  useEffect(() => {
    if (initialData.length > 0) {
      setVitals((prev) => {
        const newMap: Record<string, VitalData> = {};
        initialData.forEach(v => {
          newMap[v.device.serial] = {
            ...(prev[v.device.serial] || {}),
            ...v
          };
        });
        return newMap;
      });
    } else if (accessToken && user) {
      setVitals({});
    }
  }, [initialData, accessToken, user]);

  // ⏱ CLINI-CAL AGING ENGINE: Self-healing state detection
  useEffect(() => {
    const timer = setInterval(() => {
      setVitals((prev) => {
        const next = { ...prev };
        let hasChanged = false;

        Object.keys(next).forEach((serial) => {
          const node = next[serial];
          if (!node.vitals.timestamp) return;

          const lastUpdate = new Date(node.vitals.timestamp).getTime();
          const ageSecs = (Date.now() - lastUpdate) / 1000;

          let newState: "LIVE" | "DELAYED" | "OFFLINE" = "LIVE";
          if (ageSecs > 30) newState = "OFFLINE";
          else if (ageSecs > 10) newState = "DELAYED";

          if (node.device.state !== newState) {
            next[serial] = {
              ...node,
              device: { ...node.device, state: newState }
            };
            hasChanged = true;
          }
        });

        return hasChanged ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return { vitals: Object.values(vitals), connected };
}
