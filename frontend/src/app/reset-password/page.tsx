"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, Key, ShieldCheck, ArrowRight, Lock } from "lucide-react";

export default function ResetPasswordPage() {
    const [username, setUsername] = useState("");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");
        
        try {
            await api.post("accounts/confirm-reset/", { 
                username: username.trim(),
                token: code.trim(),  // Backend expects 'token' field for the code
                password 
            });
            setSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.detail || "Invalid or expired code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 to-zinc-950">
            <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-bold text-white tracking-tighter mb-2">CareStream</h1>
                    <p className="text-zinc-500 text-sm font-medium">Security Infrastructure</p>
                </div>

                <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-xl">Set New Credentials</CardTitle>
                        <CardDescription>
                            Verify your identity with the 6-digit code to define a new password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        {error && (
                            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl animate-in shake duration-500">
                                {error}
                            </div>
                        )}

                        {success ? (
                            <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-500">
                                <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
                                    <ShieldCheck className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-emerald-500 font-bold text-lg">Identity Secured</h3>
                                    <p className="text-zinc-400 text-sm">
                                        Your password has been successfully updated. Redirecting to system login...
                                    </p>
                                </div>
                                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mt-4" />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-zinc-500 ml-1">Username</Label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                                        <Input
                                            id="username"
                                            className="bg-zinc-950/50 border-zinc-800 pl-10 h-11 focus-visible:ring-blue-500/20 text-white"
                                            placeholder="Enter your username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="code" className="text-zinc-500 ml-1">Verification Code</Label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                                        <Input
                                            id="code"
                                            className="bg-zinc-950/50 border-zinc-800 pl-10 h-11 focus-visible:ring-blue-500/20 text-white font-bold tracking-[0.5em] text-center"
                                            placeholder="000000"
                                            maxLength={6}
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-zinc-500 ml-1">New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                                        <Input
                                            id="password"
                                            type="password"
                                            className="bg-zinc-950/50 border-zinc-800 pl-10 h-11 focus-visible:ring-emerald-500/20 text-white"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm" className="text-zinc-500 ml-1">Confirm Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                                        <Input
                                            id="confirm"
                                            type="password"
                                            className="bg-zinc-950/50 border-zinc-800 pl-10 h-11 focus-visible:ring-emerald-500/20 text-white"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <Button className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-bold mt-4" disabled={loading}>
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Update Credentials <ArrowRight className="ml-2 w-4 h-4" /></>}
                                </Button>
                                <Button type="button" variant="ghost" className="w-full text-zinc-600 hover:text-white" onClick={() => router.push("/login")}>
                                    Return to Login
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
