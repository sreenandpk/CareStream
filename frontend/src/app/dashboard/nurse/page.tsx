"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import DashboardShell from "@/components/DashboardShell";

export default function NurseDashboard() {
    const { user, _hasHydrated, logout } = useAuthStore();
    const router = useRouter();
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    useEffect(() => {
        if (_hasHydrated) {
            if (!user || user.role !== "NURSE") {
                router.push("/login");
            }
        }
    }, [user, _hasHydrated, router]);

    if (!_hasHydrated || !user) return null;

    return (
        <DashboardShell>
            <div className="p-8 space-y-8 min-h-full">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            Nurse Station
                        </h1>
                        <p className="text-zinc-500 mt-2 italic">Real-time Clinical Coordination & Ward Monitoring.</p>
                    </div>
                </div>

            <ChangePasswordModal 
                isOpen={isChangePasswordOpen} 
                onClose={() => setIsChangePasswordOpen(false)} 
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-xl">
                    <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Ward Patients</h3>
                    <p className="text-3xl font-bold">24</p>
                </div>
                <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-xl">
                    <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Pending Meds</h3>
                    <p className="text-3xl font-bold text-blue-400">8</p>
                </div>
                <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-xl">
                    <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Active Tasks</h3>
                    <p className="text-3xl font-bold text-emerald-400">5</p>
                </div>
            </div>

            <div className="mt-12 p-8 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl">
                <h2 className="text-xl font-semibold mb-6">Patient Tasks</h2>
                <div className="space-y-4 text-sm text-zinc-500 text-center py-20 border border-dashed border-zinc-800 rounded-2xl">
                    Check vital signs for Room 402.
                </div>
            </div>
            </div>
        </DashboardShell>
    );
}
