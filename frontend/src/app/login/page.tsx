"use client";
// Login Page - Fixed at 2026-04-14 18:20

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, ShieldCheck, Lock, Mail, ArrowRight, UserCircle, Clock, AlertTriangle, Shield } from "lucide-react";

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
            
            // 🛡️ High-Fidelity Redirect: Move inactive users to the professional landing page
            if (errorMsg.toLowerCase().includes("inactive")) {
                router.push("/deactivated");
                return;
            }

            setError(errorMsg);
            
            // Log security events to console for debugging
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
        <div className="min-h-screen !bg-[#F8F9FB] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* 🎨 Aesthetic Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#5C61F2]/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#5C61F2]/5 rounded-full blur-[120px]" />

            <div className="w-full max-w-[520px] animate-in fade-in slide-in-from-bottom-4 duration-1000 relative z-10">
                <div className="mb-8 text-center flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#5C61F2] flex items-center justify-center shadow-2xl shadow-[#5C61F2]/40 mb-6 animate-in zoom-in duration-1000">
                        <Shield className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter leading-none text-zinc-900 uppercase">
                        Care<span className="text-[#5C61F2]">Stream</span>
                    </h1>
                </div>

                <Card className="!bg-white border-zinc-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] rounded-[2.5rem] p-4">
                    <CardHeader className="space-y-2 pb-4">
                        <CardTitle className="text-2xl font-black tracking-tight text-zinc-800">
                            {step === 1 ? "System Authentication" : step === 2 ? "Identity Verification" : "Update Credentials"}
                        </CardTitle>
                        <CardDescription className="text-zinc-400 font-bold text-[13px] leading-relaxed">
                            {step === 1 ? "Enter your professional credentials to continue." : 
                             step === 2 ? "Check your email for the 6-digit access code." : 
                             "Set a new secure password for your account."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {error && (
                            <div className={`mb-8 p-5 rounded-[2rem] flex items-center gap-4 animate-in shake duration-500 border ${
                                error.toLowerCase().includes("locked") 
                                    ? "bg-rose-50 border-rose-100 text-rose-600" 
                                    : error.toLowerCase().includes("too many login attempts") 
                                    ? "bg-amber-50 border-amber-100 text-amber-600"
                                    : "bg-rose-50 border-rose-100 text-rose-600"
                            }`}>
                                <div className={`p-2.5 rounded-2xl ${
                                    error.toLowerCase().includes("locked") 
                                        ? "bg-rose-500/10" 
                                        : error.toLowerCase().includes("too many login attempts") 
                                        ? "bg-amber-500/10"
                                        : "bg-rose-500/10"
                                }`}>
                                    {error.toLowerCase().includes("locked") ? (
                                        <Lock className="w-4 h-4" />
                                    ) : error.toLowerCase().includes("too many login attempts") ? (
                                        <Clock className="w-4 h-4" />
                                    ) : (
                                        <AlertTriangle className="w-4 h-4" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-black text-[10px] uppercase tracking-widest mb-0.5">
                                        {error.toLowerCase().includes("locked") 
                                            ? "Access Denied" 
                                            : error.toLowerCase().includes("too many login attempts") 
                                            ? "Security Delay" 
                                            : "Auth Error"}
                                    </span>
                                    <span className="text-[12px] font-bold leading-tight opacity-90">{error}</span>
                                </div>
                            </div>
                        )}

                        {successMsg && (
                            <div className="mb-8 p-5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold rounded-[2rem] animate-in zoom-in-95 flex items-center gap-3">
                                <ShieldCheck className="w-4 h-4" />
                                {successMsg}
                            </div>
                        )}

                        {step === 1 ? (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Username</Label>
                                    <div className="relative group">
                                        <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-[#5C61F2] transition-colors" />
                                        <Input
                                            id="username"
                                            className="!bg-[#F8F9FB] border-none !text-zinc-800 pl-14 h-14 rounded-xl focus-visible:ring-[#5C61F2]/20 font-black placeholder:text-zinc-300"
                                            placeholder="e.g. sreenand.pk"
                                            value={credentials.username}
                                            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between ml-2">
                                        <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Password</Label>
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
                                            className="!bg-[#F8F9FB] border-none !text-zinc-800 pl-14 h-14 rounded-xl focus-visible:ring-[#5C61F2]/20 font-black placeholder:text-zinc-300"
                                            placeholder="••••••••"
                                            value={credentials.password}
                                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button className="w-full h-14 bg-[#5C61F2] hover:bg-[#4A4ED4] text-white shadow-xl shadow-[#5C61F2]/20 rounded-[1.2rem] font-black text-[12px] uppercase tracking-widest mt-2 transition-all active:scale-95 group" disabled={loading}>
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                                </Button>
                            </form>
                        ) : step === 2 ? (
                            <form onSubmit={handleVerifyOtp} className="space-y-8">
                                <div className="space-y-3">
                                    <Label htmlFor="otp" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Two-Factor Code</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-[#5C61F2] transition-colors" />
                                        <Input
                                            id="otp"
                                            className="!bg-[#F8F9FB] border-none !text-zinc-800 pl-14 h-16 rounded-2xl text-center tracking-[0.8em] font-black text-xl focus-visible:ring-[#5C61F2]/20"
                                            placeholder="000000"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Button className="w-full h-16 bg-[#5C61F2] hover:bg-[#4A4ED4] text-white shadow-xl shadow-[#5C61F2]/20 rounded-[1.5rem] font-black text-[12px] uppercase tracking-widest transition-all active:scale-95" disabled={loading}>
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Identity"}
                                    </Button>
                                    <Button type="button" variant="ghost" className="w-full h-14 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:!bg-[#5C61F2]/5 hover:!text-[#5C61F2] transition-colors" onClick={() => setStep(1)}>
                                        Back to Login
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleForceReset} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Current Password</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-[#5C61F2] transition-colors" />
                                        <Input
                                            type="password"
                                            className="!bg-[#F8F9FB] border-none !text-zinc-800 pl-14 h-16 rounded-2xl focus-visible:ring-[#5C61F2]/20 font-black"
                                            placeholder="Current password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="h-px bg-zinc-50 my-2" />

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">New Password</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-emerald-500 transition-colors" />
                                        <Input
                                            type="password"
                                            className="!bg-[#F8F9FB] border-none !text-zinc-800 pl-14 h-16 rounded-2xl focus-visible:ring-emerald-500/10 font-black"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Confirm New Password</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-emerald-500 transition-colors" />
                                        <Input
                                            type="password"
                                            className="!bg-[#F8F9FB] border-none !text-zinc-800 pl-14 h-16 rounded-2xl focus-visible:ring-emerald-500/10 font-black"
                                            placeholder="••••••••"
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4 pt-2">
                                    <Button className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/20 rounded-[1.5rem] font-black text-[12px] uppercase tracking-widest transition-all active:scale-95" disabled={loading}>
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Secure Account"}
                                    </Button>
                                    <Button type="button" variant="ghost" className="w-full h-14 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:!bg-[#5C61F2]/5 hover:!text-[#5C61F2] transition-colors" onClick={() => setStep(1)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-8 flex justify-center">
                    <button 
                        onClick={() => router.push("/docs")}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 rounded-full text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-[#5C61F2] hover:border-[#5C61F2]/30 hover:bg-[#5C61F2]/5 transition-all shadow-sm"
                    >
                        <Layers className="w-3.5 h-3.5" />
                        System Documentation
                    </button>
                </div>
            </div>

            </div>
        </div>
    );
}