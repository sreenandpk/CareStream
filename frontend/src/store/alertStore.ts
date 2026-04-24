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
}

export const useAlertStore = create<AlertState>((set) => ({
  activeAlerts: [],
  setAlerts: (alerts) => set({ activeAlerts: alerts }),
  addAlert: (alert) => set((state) => ({
    // Add to top, keep unique
    activeAlerts: [alert, ...state.activeAlerts.filter(a => a.id !== alert.id)].slice(0, 50)
  })),
  removeAlert: (id) => set((state) => ({
    activeAlerts: state.activeAlerts.filter(a => a.id !== id)
  })),
  clearAlerts: () => set({ activeAlerts: [] }),
}));
