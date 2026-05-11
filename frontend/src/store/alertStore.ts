import { create } from "zustand";

export interface AlertData {
  id: number;
  patient: string;
  device_serial: string;
  monitor_label?: string; // 🔥 NEW
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  message: string;
  timestamp: string;
}

interface AlertState {
  activeAlerts: AlertData[];
  setAlerts: (alerts: AlertData[]) => void;
  addAlert: (alert: AlertData) => void;
  removeAlert: (id: number) => void;
  clearAlerts: () => void;
  syncAlerts: () => Promise<void>;
}

export const useAlertStore = create<AlertState>((set) => ({
  activeAlerts: [],
  setAlerts: (alerts) => set({ activeAlerts: alerts }),
  addAlert: (alert) => set((state) => ({
    activeAlerts: [alert, ...state.activeAlerts.filter(a => a.id !== alert.id)].slice(0, 50)
  })),
  removeAlert: (id) => set((state) => ({
    activeAlerts: state.activeAlerts.filter(a => a.id !== id)
  })),
  clearAlerts: () => set({ activeAlerts: [] }),
  syncAlerts: async () => {
    try {
        const auth = (await import("@/store/authStore")).useAuthStore.getState();
        const role = auth.user?.role;
        if (!role) return;

        const api = (await import("@/lib/axios")).default;
        // 🔬 Role-Aware Routing: Ensures 403 errors are prevented by using authorized streams
        const endpoint = `alerts/${role.toLowerCase()}/`;
        const res = await api.get(endpoint);
        
        if (res.data.success) {
            // 🔬 Telemetry Normalization: Harmonizing backend signals for universal frontend rendering
            const normalized = res.data.data.map((a: any) => ({
                ...a,
                type: a.type || a.alert_type || "INCIDENT",
                patient: a.patient?.name || a.patient_name || a.patient || "SIGNAL_FAULT",
                timestamp: a.timestamp || a.created_at || new Date().toISOString()
            }));

            // 🛡️ 30-MINUTE SIGNAL EXPIRATION: Maintaining board fidelity by purging stale telemetry
            const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
            const fresh = normalized.filter(a => {
                try {
                    return new Date(a.timestamp) > thirtyMinsAgo;
                } catch {
                    return true; // Keep if date is malformed to avoid losing data
                }
            });

            set({ activeAlerts: fresh });
        }
    } catch (e) {
        console.error("Alert Sync Failure:", e);
    }
  }
}));
