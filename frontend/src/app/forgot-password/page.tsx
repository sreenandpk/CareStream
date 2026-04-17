"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft, Send } from "lucide-react";

export default function ForgotPasswordPage() {
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            await api.post("accounts/forgot-password/", { username });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.detail || "Failed to process request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 to-zinc-950">
            <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-bold text-white tracking-tighter mb-2">CareStream</h1>
                    <p className="text-zinc-500 text-sm font-medium">Password Recovery System</p>
                </div>

                <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <button 
                                onClick={() => router.push("/login")}
                                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <CardTitle className="text-xl">Authentication Recovery</CardTitle>
                        </div>
                        <CardDescription>
                            Enter your system username to receive a security reset token.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        {error && (
                            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl animate-in shake duration-500">
                                {error}
                            </div>
                        )}

                        {success ? (
                            <div className="space-y-6 animate-in zoom-in-95 duration-500">
                                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center text-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                        <Mail className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-emerald-500 font-bold">Request Sent Successfully</p>
                                        <p className="text-zinc-400 text-[11px] leading-relaxed">
                                            If an account exists for <span className="text-zinc-200 font-mono">@{username}</span>, 
                                            a 6-digit verification code has been sent to your registered email address.
                                        </p>
                                    </div>
                                </div>
                                <Button 
                                    className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-bold"
                                    onClick={() => router.push("/reset-password")}
                                >
                                    Proceed to Reset <Send className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-zinc-500 ml-1">Username</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
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
                                <div className="space-y-3">
                                    <Button className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-bold" disabled={loading}>
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Request Token"}
                                    </Button>
                                    <Button type="button" variant="ghost" className="w-full text-zinc-600 hover:text-white" onClick={() => router.push("/login")}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
