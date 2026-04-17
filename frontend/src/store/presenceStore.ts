import { create } from "zustand";

interface PresenceState {
    onlineUserIds: Set<number>;
    lastLogins: Record<number, string>;
    lastSecurityEvent: { userId: number; email: string; type: string; timestamp: number } | null;
    setOnlineUsers: (ids: number[]) => void;
    updateUserStatus: (userId: number, status: "online" | "offline" | "invalid", lastLogin?: string, email?: string) => void;
    clearOnlineUsers: () => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
    onlineUserIds: new Set(),
    lastLogins: {},
    lastSecurityEvent: null,
    setOnlineUsers: (ids) => set({ onlineUserIds: new Set(ids.map(Number)) }),
    updateUserStatus: (userId, status, lastLogin, email) => set((state) => {
        const uid = Number(userId);
        const newSet = new Set(state.onlineUserIds);
        const newLastLogins = { ...state.lastLogins };
        let newSecurityEvent = state.lastSecurityEvent;

        if (status === "online") {
            newSet.add(uid);
            if (lastLogin) newLastLogins[uid] = lastLogin;
        } else if (status === "offline") {
            newSet.delete(uid);
        } else if (status === "invalid") {
            // 🚨 Capture security event for the UI
            newSecurityEvent = { 
                userId: uid, 
                email: email || "Unknown", 
                type: "BOUNCE", 
                timestamp: Date.now() 
            };
        }
        return { 
            onlineUserIds: newSet, 
            lastLogins: newLastLogins,
            lastSecurityEvent: newSecurityEvent
        };
    }),
    clearOnlineUsers: () => set({ onlineUserIds: new Set(), lastLogins: {}, lastSecurityEvent: null }),
}));
