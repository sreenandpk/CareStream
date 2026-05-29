"use client";
// Login Page - Fixed at 2026-04-14 18:20

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, ShieldCheck, Lock, Mail, ArrowRight, UserCircle, Clock, AlertTriangle, Shield, Layers, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
    const [credentials, setCredentials] = useState({ username: "", password: "" });
    const [otp, setOtp] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [step, setStep] = useState(1); // 1: Login, 2: OTP, 3: Force Password Reset
    const [resetToken, setResetToken] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const { setAuth } = useAuthStore();
    const router = useRouter();

    // Auto-login trigger for Portfolio Launch
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const demoRole = urlParams.get("demo");
        if (demoRole === "doctor" || demoRole === "nurse") {
            triggerDemoLogin(demoRole);
        }
    }, []);

    const triggerDemoLogin = async (role: "doctor" | "nurse") => {
        setError("");
        setLoading(true);
        try {
            const res = await api.post(`accounts/demo-login/?role=${role}`);
            setAuth(res.data.data, res.data.data.access);
            router.push(role === "doctor" ? "/dashboard/doctor" : "/dashboard/nurse");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to initialize secure demo session.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await api.post("accounts/login/", credentials);
            
            if (res.data.otp_required) {
                setStep(2);
                setSuccessMsg("Verification code sent to your email.");
            } else if (res.data.reset_required) {
                setResetToken(res.data.reset_token);
                setStep(3);
            } else {
                setAuth(res.data.data, res.data.data.access);
                router.push(res.data.data.role === "ADMIN" ? "/dashboard/admin" : 
                            res.data.data.role === "DOCTOR" ? "/dashboard/doctor" : "/dashboard/nurse");
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.response?.data?.detail || "Invalid credentials";
            
            if (errorMsg.toLowerCase().includes("inactive")) {
                router.push("/deactivated");
                return;
            }

            setError(errorMsg);
            
            if (err.response?.status === 429) {
                console.warn("Security: Rate limit exceeded");
            } else if (errorMsg.toLowerCase().includes("locked")) {
                console.error("Security: Account locked");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await api.post("accounts/verify-otp/", {
                username: credentials.username,
                code: otp
            });

            if (res.data.reset_required) {
                setResetToken(res.data.reset_token);
                setStep(3);
            } else {
                setAuth(res.data.data, res.data.data.access);
                router.push(res.data.data.role === "ADMIN" ? "/dashboard/admin" : 
                            res.data.data.role === "DOCTOR" ? "/dashboard/doctor" : "/dashboard/nurse");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid or expired code");
        } finally {
            setLoading(false);
        }
    };

    const handleForceReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            setError("Passwords do not match");
            return;
        }

        setError("");
        setLoading(true);

        try {
            await api.post("accounts/confirm-reset/", {
                username: credentials.username,
                token: resetToken,
                old_password: oldPassword,
                password: newPassword
            });
            setStep(1);
            setSuccessMsg("Credentials secured successfully. Please login with your new password.");
            setCredentials({ username: credentials.username, password: "" });
            setOldPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.detail || "Failed to update credentials");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden selection:bg-blue-100 selection:text-blue-700">
            {/* 🌌 AMBIENT GLOW */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#5C61F2]/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#5C61F2]/5 rounded-full blur-[120px]" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[480px] relative z-10"
            >
                {/* 🛡️ BRANDING */}
                <div className="mb-10 text-center flex flex-col items-center">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="w-16 h-16 rounded-[1.5rem] bg-[#5C61F2] flex items-center justify-center shadow-2xl shadow-[#5C61F2]/30 mb-6"
                    >
                        <Shield className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-4xl font-black tracking-tighter leading-none text-zinc-900 uppercase">
                        Care<span className="text-[#5C61F2]">Stream</span>
                    </h1>
                </div>

                {/* 🔐 AUTH CARD */}
                <Card className="bg-white border-zinc-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] rounded-[2.5rem] overflow-hidden border-none p-2 md:p-4">
                    <CardHeader className="space-y-2 pb-6">
                        <CardTitle className="text-2xl font-black tracking-tight text-zinc-800">
                            {step === 1 ? "System Access" : step === 2 ? "Verify Identity" : "Reset Credentials"}
                        </CardTitle>
                        <CardDescription className="text-zinc-400 font-bold text-[13px] leading-relaxed">
                            {step === 1 ? "Enter your professional credentials to proceed." : 
                             step === 2 ? "A 6-digit code has been sent to your clinical email." : 
                             "Secure your account with a new master password."}
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                {error && (
                                    <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in shake-2 duration-300">
                                        <AlertTriangle size={18} className="shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Access Denied</span>
                                            <span className="text-xs font-bold leading-tight">{error}</span>
                                        </div>
                                    </div>
                                )}

                                {successMsg && (
                                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600">
                                        <ShieldCheck size={18} className="shrink-0" />
                                        <span className="text-xs font-bold">{successMsg}</span>
                                    </div>
                                )}

                                {step === 1 ? (
                                    <form onSubmit={handleLogin} className="space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">ID Number / Username</Label>
                                            <div className="relative group">
                                                <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-[#5C61F2] transition-colors" />
                                                <Input
                                                    id="username"
                                                    className="h-14 bg-zinc-50 border-none rounded-2xl pl-14 font-bold text-zinc-800 placeholder:text-zinc-300 focus-visible:ring-2 focus-visible:ring-[#5C61F2]/20"
                                                    placeholder="e.g. sreenand.pk"
                                                    value={credentials.username}
                                                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between ml-2">
                                                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Master Password</Label>
                                                <button 
                                                    type="button"
                                                    onClick={() => router.push("/forgot-password")}
                                                    className="text-[9px] text-[#5C61F2] hover:text-[#4A4ED4] font-black uppercase tracking-widest transition-colors"
                                                >
                                                    Forgot?
                                                </button>
                                            </div>
                                            <div className="relative group">
                                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-[#5C61F2] transition-colors" />
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    className="h-14 bg-zinc-50 border-none rounded-2xl pl-14 font-bold text-zinc-800 placeholder:text-zinc-300 focus-visible:ring-2 focus-visible:ring-[#5C61F2]/20"
                                                    placeholder="••••••••"
                                                    value={credentials.password}
                                                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <Button className="w-full h-14 bg-[#5C61F2] hover:bg-[#4A4ED4] text-white shadow-xl shadow-[#5C61F2]/20 rounded-2xl font-black text-[12px] uppercase tracking-widest mt-2 transition-all active:scale-95 group" disabled={loading}>
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Access Dashboard <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                                        </Button>
                                    </form>
                                ) : step === 2 ? (
                                    <form onSubmit={handleVerifyOtp} className="space-y-8">
                                        <div className="space-y-3">
                                            <Label htmlFor="otp" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Clinical Access Code</Label>
                                            <div className="relative group text-center">
                                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-[#5C61F2] transition-colors" />
                                                <Input
                                                    id="otp"
                                                    className="h-16 bg-zinc-50 border-none rounded-2xl pl-14 font-black text-2xl tracking-[0.6em] text-center text-zinc-800 focus-visible:ring-2 focus-visible:ring-[#5C61F2]/20"
                                                    placeholder="000000"
                                                    maxLength={6}
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <Button className="w-full h-16 bg-[#5C61F2] hover:bg-[#4A4ED4] text-white shadow-xl shadow-[#5C61F2]/20 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all active:scale-95" disabled={loading}>
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Identity"}
                                            </Button>
                                            <Button type="button" variant="ghost" className="w-full h-12 text-zinc-400 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-50 rounded-xl" onClick={() => setStep(1)}>
                                                Back to Login
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={handleForceReset} className="space-y-5">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Existing Password</Label>
                                            <Input
                                                type="password"
                                                className="h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold text-zinc-800"
                                                placeholder="Enter current password"
                                                value={oldPassword}
                                                onChange={(e) => setOldPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">New Password</Label>
                                            <Input
                                                type="password"
                                                className="h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold text-zinc-800"
                                                placeholder="At least 8 characters"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Confirm New Password</Label>
                                            <Input
                                                type="password"
                                                className="h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold text-zinc-800"
                                                placeholder="Repeat new password"
                                                value={confirmNewPassword}
                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="pt-4 space-y-4">
                                            <Button className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/20 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all active:scale-95" disabled={loading}>
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Secure Account"}
                                            </Button>
                                            <Button type="button" variant="ghost" className="w-full h-12 text-zinc-400 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-50 rounded-xl" onClick={() => setStep(1)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </CardContent>
                </Card>

                {/* 📖 PROJECT GUIDE LINK */}
                <div className="mt-12 flex justify-center">
                    <button 
                        onClick={() => router.push("/docs")}
                        className="group flex items-center gap-3 px-8 py-3.5 bg-white/50 backdrop-blur-md border border-zinc-200 rounded-full text-[12px] font-bold text-zinc-500 hover:text-[#5C61F2] hover:border-[#5C61F2]/40 hover:bg-white transition-all shadow-sm hover:shadow-xl hover:shadow-[#5C61F2]/10"
                    >
                        <div className="p-1.5 bg-zinc-100 rounded-lg group-hover:bg-[#5C61F2]/10 transition-colors">
                            <BookOpen className="w-4 h-4 text-zinc-400 group-hover:text-[#5C61F2]" />
                        </div>
                        Project Guide
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
