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
import { Loader2, ShieldCheck, Lock, Mail, ArrowRight, UserCircle, Clock, AlertTriangle } from "lucide-react";

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
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 to-zinc-950">
            <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        System Secure
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tighter mb-2">CareStream</h1>
                    <p className="text-zinc-500 text-sm font-medium">Enterprise Health Management</p>
                </div>

                <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-xl">
                            {step === 1 ? "System Authentication" : step === 2 ? "Identity Verification" : "Update Credentials"}
                        </CardTitle>
                        <CardDescription>
                            {step === 1 ? "Enter your professional credentials to continue." : 
                             step === 2 ? "Check your email for the 6-digit access code." : 
                             "Set a new secure password for your account."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        {error && (
                            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in shake duration-500 border ${
                                error.toLowerCase().includes("locked") 
                                    ? "bg-rose-500/10 border-rose-500/30 text-rose-500" 
                                    : error.toLowerCase().includes("too many login attempts") 
                                    ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                                    : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                            }`}>
                                <div className={`p-1.5 rounded-md ${
                                    error.toLowerCase().includes("locked") 
                                        ? "bg-rose-500/20" 
                                        : error.toLowerCase().includes("too many login attempts") 
                                        ? "bg-amber-500/20"
                                        : "bg-rose-500/20"
                                }`}>
                                    {error.toLowerCase().includes("locked") ? (
                                        <Lock className="w-3.5 h-3.5" />
                                    ) : error.toLowerCase().includes("too many login attempts") ? (
                                        <Clock className="w-3.5 h-3.5" />
                                    ) : (
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-[10px] uppercase tracking-wider mb-0.5">
                                        {error.toLowerCase().includes("locked") 
                                            ? "Access Denied" 
                                            : error.toLowerCase().includes("too many login attempts") 
                                            ? "Security Delay" 
                                            : "Authentication Error"}
                                    </span>
                                    <span className="text-[11px] leading-tight opacity-90">{error}</span>
                                </div>
                            </div>
                        )}

                        {successMsg && (
                            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl animate-in zoom-in-95">
                                {successMsg}
                            </div>
                        )}

                        {step === 1 ? (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-zinc-500 ml-1">Username</Label>
                                    <div className="relative">
                                        <UserCircle className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                                        <Input
                                            id="username"
                                            className="bg-zinc-950/50 border-zinc-800 pl-10 h-11 focus-visible:ring-blue-500/20 text-white"
                                            placeholder="j.doe"
                                            value={credentials.username}
                                            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-zinc-500 ml-1">Password</Label>
                                        <button 
                                            type="button"
                                            onClick={() => router.push("/forgot-password")}
                                            className="text-[11px] text-zinc-600 hover:text-blue-400 font-bold uppercase tracking-wider transition-colors"
                                        >
                                            Forgot?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                                        <Input
                                            id="password"
                                            type="password"
                                            className="bg-zinc-950/50 border-zinc-800 pl-10 h-11 focus-visible:ring-blue-500/20 text-white"
                                            placeholder="••••••••"
                                            value={credentials.password}
                                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                <Button className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-bold mt-4" disabled={loading}>
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="ml-2 w-4 h-4" /></>}
                                </Button>
                            </form>
                        ) : step === 2 ? (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="otp" className="text-zinc-500 ml-1">Two-Factor Code</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                                        <Input
                                            id="otp"
                                            className="bg-zinc-950/50 border-zinc-800 pl-10 h-11 text-center tracking-[0.5em] font-bold text-lg"
                                            placeholder="000000"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Button className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-bold" disabled={loading}>
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Identity"}
                                    </Button>
                                    <Button type="button" variant="ghost" className="w-full text-zinc-500" onClick={() => setStep(1)}>
                                        Back to Login
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleForceReset} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 ml-1">Current Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                                        <Input
                                            type="password"
                                            className="bg-zinc-950/50 border-zinc-800 pl-10 h-11 focus-visible:ring-blue-500/20 text-white"
                                            placeholder="Current password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="h-px bg-zinc-900 my-2" />

                                <div className="space-y-2">
                                    <Label className="text-zinc-500 ml-1">New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                                        <Input
                                            type="password"
                                            className="bg-zinc-950/50 border-zinc-800 pl-10 h-11 focus-visible:ring-emerald-500/20 text-white"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 ml-1">Confirm New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                                        <Input
                                            type="password"
                                            className="bg-zinc-950/50 border-zinc-800 pl-10 h-11 focus-visible:ring-emerald-500/20 text-white"
                                            placeholder="••••••••"
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold" disabled={loading}>
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Secure Account"}
                                    </Button>
                                    <Button type="button" variant="ghost" className="w-full text-zinc-500" onClick={() => setStep(1)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-12 flex justify-center items-center gap-6">
                    <ShieldCheck className="w-5 h-5 text-zinc-800" />
                    <div className="h-4 w-px bg-zinc-800" />
                    <p className="text-[10px] text-zinc-700 uppercase tracking-widest font-bold">Encrypted End-to-End</p>
                </div>
            </div>
        </div>
    );
}