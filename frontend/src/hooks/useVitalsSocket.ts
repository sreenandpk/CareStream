"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useVitalsStore } from "@/store/vitalsStore";
import api from "@/lib/axios";

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
    clinical_condition?: "STABLE" | "GUARDED" | "CRITICAL" | "RECOVERING";
  };
  vitals: {
    heart_rate: number;
    spo2: number;
    temperature: number;
    bp: string;
    timestamp: string;
  };
  system_condition?: "NORMAL" | "WARNING" | "CRITICAL";
  ai_suggestion?: {
    suggested_condition: string;
    reasons: string[];
    ai_confidence?: number;
  };
  waveform?: {
    ecg: number[];
    spo2: number[];
  };
  system?: {
    rssi: number | null;
    uptime: number | null;
    signal_quality: string;
    signal_state: "GOOD" | "WEAK" | "LOST";
    sensor_connected: boolean;
    device_mode: string;
  };
  ai_condition_summary?: string;
  ward_id?: number;
  room_id?: number;
  bed_id?: number;
}

export interface VitalsSocketOptions {
  initialData?: VitalData[];
  autoConnect?: boolean;
  role?: 'DOCTOR' | 'NURSE' | 'ADMIN';
}

// 🏥 WAVEFORM GENERATIVE ENGINE (Clinical Fidelity)
export const generateSyntheticWaveform = (type: "ECG" | "PPG", rate: number, points: number) => {
    const data: number[] = [];
    const frequency = (rate / 60) * (points / 100);
    for (let i = 0; i < points; i++) {
        if (type === "ECG") {
            const base = Math.sin(i * frequency * 0.5) * 0.2;
            const qrs = i % Math.floor(points / (rate / 60)) < 4 ? 2.0 : 0;
            data.push(base + qrs + (Math.random() * 0.1));
        } else {
            const cycle = i % Math.floor(points / (rate / 60));
            const val = Math.sin((cycle / Math.floor(points / (rate / 60))) * Math.PI) * 1.2;
            data.push(val + (Math.random() * 0.05));
        }
    }
    return data;
};

export default function useVitalsSocket(arg: VitalsSocketOptions | VitalData[] = []) {
  const { accessToken, user, _hasHydrated } = useAuthStore();
  const { vitalsMap, connected, latency, connect } = useVitalsStore();

  const options = Array.isArray(arg) ? { initialData: arg } : arg;
  const initialData = options.initialData || [];

  // Start connection through store if needed
  useEffect(() => {
    if (_hasHydrated && accessToken && user && options.autoConnect) {
      connect(accessToken);
    }
  }, [_hasHydrated, accessToken, user, connect, options.autoConnect]);

  // Handle initialization/backfill seeds
  useEffect(() => {
    if (initialData.length > 0) {
      useVitalsStore.getState().setVitals(initialData);
    }
  }, [initialData]);

  // ⏱ CLINI-CAL AGING ENGINE (Self-Healing - Moved to Page/Grid for granular local state)
  // This hook now primarily acts as a gateway to the Global Store

  return { 
    vitals: Object.values(vitalsMap), 
    vitalsMap, 
    connected, 
    latency 
  };
}
