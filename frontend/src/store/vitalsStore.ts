import { create } from 'zustand';
import { VitalData } from '@/hooks/useVitalsSocket';
import api from '@/lib/axios';

interface VitalsState {
  vitalsMap: Record<string, VitalData>;
  connected: boolean;
  latency: number | null;
  socket: WebSocket | null;
  
  // Actions
  setVitals: (vitals: VitalData[]) => void;
  updateVital: (data: VitalData) => void;
  setConnected: (status: boolean) => void;
  setLatency: (ms: number | null) => void;
  clearVitals: () => void;
  connect: (token: string) => void;
  disconnect: () => void;
  checkStaleness: () => void;
  lastUpdateMap: Record<string, number>;
}

let reconnectTimer: NodeJS.Timeout | null = null;
let heartbeatTimer: NodeJS.Timeout | null = null;

export const useVitalsStore = create<VitalsState>((set, get) => ({
  vitalsMap: {},
  connected: false,
  latency: null,
  socket: null,
  lastUpdateMap: {},

  setVitals: (vitalsList) => set((state) => {
    const newMap = { ...state.vitalsMap };
    const newUpdateMap = { ...state.lastUpdateMap };
    const now = Date.now();

    vitalsList.forEach(v => {
      if (v?.device?.serial) {
        newMap[v.device.serial] = {
           ...(state.vitalsMap[v.device.serial] || {}),
           ...v,
           is_stale: false
        };
        newUpdateMap[v.device.serial] = now;
      }
    });
    return { vitalsMap: newMap, lastUpdateMap: newUpdateMap };
  }),

  updateVital: (data) => set((state) => {
    const serial = data.device.serial;
    const existing = state.vitalsMap[serial] || {};
    const now = Date.now();
    const { generateSyntheticWaveform } = require('@/lib/waveform-utils');
    
    // Generate waveforms if missing or empty in current packet
    const hr = (data.vitals?.heart_rate !== undefined && data.vitals?.heart_rate !== null) 
      ? data.vitals.heart_rate 
      : (existing.vitals?.heart_rate !== undefined && existing.vitals?.heart_rate !== null) 
        ? existing.vitals.heart_rate 
        : 0;

    const spo2 = (data.vitals?.spo2 !== undefined && data.vitals?.spo2 !== null) 
      ? data.vitals.spo2 
      : (existing.vitals?.spo2 !== undefined && existing.vitals?.spo2 !== null) 
        ? existing.vitals.spo2 
        : 0;

    // 🏥 FLATLINE ENFORCEMENT: If HR is 0, we MUST flatline even if we have cached rhythm
    const waveform = {
      ecg: (hr > 0 && data.waveform?.ecg && data.waveform.ecg.length > 0) 
        ? data.waveform.ecg 
        : (hr > 0 && existing.waveform?.ecg && existing.waveform.ecg.length > 0)
          ? existing.waveform.ecg
          : generateSyntheticWaveform("ECG", hr, 400),
      spo2: (spo2 > 0 && data.waveform?.spo2 && data.waveform.spo2.length > 0)
        ? data.waveform.spo2
        : (spo2 > 0 && existing.waveform?.spo2 && existing.waveform.spo2.length > 0)
          ? existing.waveform.spo2
          : generateSyntheticWaveform("PPG", spo2, 400),
    };
    
    return {
      lastUpdateMap: { ...state.lastUpdateMap, [serial]: now },
      vitalsMap: {
        ...state.vitalsMap,
        [serial]: {
          ...existing,
          ...data,
          vitals: { ...(existing.vitals || {}), ...data.vitals },
          waveform: waveform,
          ward_id: data.patient?.ward_id || existing.ward_id,
          room_id: data.patient?.room_id || existing.room_id,
          bed_id: data.patient?.bed_id || existing.bed_id,
          is_stale: false
        }
      }
    };
  }),

  checkStaleness: () => set((state) => {
    const now = Date.now();
    const STALE_THRESHOLD = 30000; // 30 seconds
    const newMap = { ...state.vitalsMap };
    let changed = false;

    Object.keys(newMap).forEach(serial => {
        const lastUpdate = state.lastUpdateMap[serial] || 0;
        if (now - lastUpdate > STALE_THRESHOLD && !newMap[serial].is_stale) {
            newMap[serial] = { ...newMap[serial], is_stale: true };
            changed = true;
        }
    });

    return changed ? { vitalsMap: newMap } : state;
  }),

  setConnected: (status) => set({ connected: status }),
  setLatency: (ms) => set({ latency: ms }),
  clearVitals: () => set({ vitalsMap: {}, connected: false, latency: null }),

  connect: async (token) => {
    if (get().connected || get().socket) return;

    // 🔬 PHASE 1: CLINICAL SNAPSHOT (Nexus Warming)
    try {
        const res = await api.get("vitals/admin/snapshot/");
        if (res.data.success) {
            const { generateSyntheticWaveform } = require("@/lib/waveform-utils");
            const baseSnapshot = (res.data.results || []).map((d: any) => {
                const hr = d.heart_rate !== undefined && d.heart_rate !== null ? d.heart_rate : 0;
                const spo2 = d.spo2 !== undefined && d.spo2 !== null ? d.spo2 : 0;
                return {
                    device: { id: d.device_id, serial: d.device_serial, label: d.device_label, mode: d.device_mode, state: d.device_state, last_seen: d.timestamp },
                    patient: { id: d.patient_id, name: d.patient_name, location: `Ward ${d.ward_id} / Bed ${d.bed_number}`, ward_id: d.ward_id },
                    vitals: { heart_rate: hr, spo2: spo2, temperature: d.temperature, bp: d.bp || "120/80", timestamp: d.timestamp },
                    waveform: {
                        ecg: generateSyntheticWaveform("ECG", hr, 400),
                        spo2: generateSyntheticWaveform("PPG", spo2, 400)
                    },
                    ward_id: d.ward_id, room_id: d.room_id, bed_id: d.bed_id
                };
            });
            get().setVitals(baseSnapshot);
        }
    } catch (e) {
        console.error("Nexus Warming Failure:", e);
    }

    // 🔬 PHASE 2: TELEMETRY NEXUS (Live Link)
    const baseUrl = (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000").replace(/\/$/, "");
    const path = baseUrl.endsWith("/ws") ? "/vitals/" : "/ws/vitals/";
    const wsUrl = `${baseUrl}${path}?token=${encodeURIComponent(token)}`;

    console.log("Telemetry Nexus: Establishing Link...");
    const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("Telemetry Nexus: Link Secured.");
        set({ connected: true, socket });
        
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(() => {
          const s = get().socket;
          if (s?.readyState === WebSocket.OPEN) {
            s.send(JSON.stringify({ event: "PING", timestamp: Date.now() }));
          }
          // 🔥 Signal Aging Check
          get().checkStaleness();
        }, 5000);
      };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === "PONG") {
          get().setLatency(Date.now() - payload.timestamp);
          return;
        }
        if (payload.event === "VITAL_UPDATE") {
          get().updateVital(payload.data);
        }
      } catch (e) {
        console.error("Nexus Frame Corruption", e);
      }
    };

    socket.onclose = () => {
      console.warn("Telemetry Nexus: Link Severed. Recovering...");
      set({ connected: false, socket: null });
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        const currentToken = require("@/store/authStore").useAuthStore.getState().accessToken;
        if (currentToken) get().connect(currentToken);
      }, 5000);
    };

    set({ socket });
  },

  disconnect: () => {
    const s = get().socket;
    if (s) s.close();
    set({ socket: null, connected: false });
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (reconnectTimer) clearTimeout(reconnectTimer);
  }
}));
