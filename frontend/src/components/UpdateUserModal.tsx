"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ShieldCheck, Mail } from "lucide-react";

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    phone?: string;
    specialization?: string;
    license_number?: string;
    is_active: boolean;
    is_locked: boolean;
}

interface UpdateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null;
}

export default function UpdateUserModal({ isOpen, onClose, onSuccess, user }: UpdateUserModalProps) {
    const [formData, setFormData] = useState({
        email: "",
        role: "NURSE",
        phone: "",
        specialization: "",
        license_number: "",
    });
    const [otp, setOtp] = useState("");
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email || "",
                role: user.role || "NURSE",
                phone: user.phone || "",
                specialization: user.specialization || "",
                license_number: user.license_number || "",
            });
            setShowOtpInput(false);
            setOtp("");
        }
    }, [user, isOpen]);

    if (!user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const payload: any = {
                email: formData.email.trim(),
                role: formData.role,
                phone: formData.phone.trim() || null,
            };

            if (formData.role === "DOCTOR") {
                payload.specialization = formData.specialization.trim() || null;
                payload.license_number = formData.license_number.trim() || null;
            }

            // Include OTP if we are in the second stage
            if (showOtpInput) {
                payload.otp = otp.trim();
            }

            const response = await api.put(`accounts/users/${user.id}/update/`, payload);
            
            if (response.data.otp_required) {
                setShowOtpInput(true);
                return;
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || err.response?.data?.message || err.response?.data?.detail || "Failed to update user");
        } finally {
            setLoading(false);
        }
    };

    const isEmailChanged = user && formData.email.trim().toLowerCase() !== user.email.toLowerCase();
    const isClinical = formData.role === "DOCTOR" || formData.role === "NURSE";
    const showVerificationState = loading && isEmailChanged && isClinical && !showOtpInput;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        {showOtpInput ? (
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            </div>
                        ) : null}
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight">
                                {showOtpInput ? "Verify Identity" : "Edit Profile"}
                            </DialogTitle>
                            <DialogDescription className="text-zinc-500">
                                {showOtpInput 
                                    ? `Confirm email change for user ${user.username}`
                                    : `Update information for ${user.username}`
                                }
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm rounded-lg flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-rose-500" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!showOtpInput ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-email" className="text-zinc-400">Email Address</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    className={`bg-zinc-900 border-zinc-800 ${user.role === 'ADMIN' ? 'opacity-50 cursor-not-allowed text-zinc-500' : ''}`}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    disabled={loading || user.role === 'ADMIN'}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-phone" className="text-zinc-400">Phone Number</Label>
                                    <Input
                                        id="edit-phone"
                                        className="bg-zinc-900 border-zinc-800"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Optional"
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Access Role</Label>
                                    <Select 
                                        value={formData.role} 
                                        onValueChange={(v) => setFormData({ ...formData, role: v })}
                                        disabled={loading || user.role === 'ADMIN'}
                                    >
                                        <SelectTrigger className={`bg-zinc-900 border-zinc-800 ${user.role === 'ADMIN' ? 'opacity-50 cursor-not-allowed text-zinc-500' : ''}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                            <SelectItem value="DOCTOR">Medical Doctor</SelectItem>
                                            <SelectItem value="NURSE">Nursing Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {formData.role === "DOCTOR" && (
                                <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 space-y-4 animate-in slide-in-from-top-2">
                                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                                        Clinical Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-spec" className="text-[10px] uppercase font-bold text-zinc-500">Specialization</Label>
                                            <Input
                                                id="edit-spec"
                                                className="bg-zinc-900 border-zinc-800 h-9"
                                                value={formData.specialization}
                                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-license" className="text-[10px] uppercase font-bold text-zinc-500">License #</Label>
                                            <Input
                                                id="edit-license"
                                                className="bg-zinc-900 border-zinc-800 h-9"
                                                value={formData.license_number}
                                                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 py-4 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                                    <Mail className="w-8 h-8 text-blue-400" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-zinc-400 px-4">
                                        We've sent a 6-digit verification code to <br/>
                                        <span className="text-blue-400 font-bold">{formData.email}</span>
                                    </p>
                                    <p className="text-[11px] text-zinc-500 italic">
                                        Please enter the code provided by the staff member.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="otp-input" className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">Verification Code</Label>
                                <Input
                                    id="otp-input"
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    className="bg-zinc-900 border-zinc-800 text-center text-2xl font-mono tracking-[0.5em] h-14"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                    required
                                    autoFocus
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => showOtpInput ? setShowOtpInput(false) : onClose()}
                            className="text-zinc-400 hover:text-white"
                            disabled={loading}
                        >
                            {showOtpInput ? "Back" : "Cancel"}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || (showOtpInput && otp.length !== 6)}
                            className={`font-bold px-8 shadow-lg transition-all ${
                                showOtpInput 
                                ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20" 
                                : showVerificationState 
                                    ? "bg-amber-600 hover:bg-amber-500 animate-pulse shadow-amber-500/20" 
                                    : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"
                            }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                    {showOtpInput ? "Finalizing..." : showVerificationState ? "Verifying..." : "Saving..."}
                                </>
                            ) : (
                                showOtpInput ? "Finalize Update" : "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                    {showVerificationState && (
                        <p className="text-[11px] text-center text-amber-500 font-mono animate-pulse pb-4">
                            🔒 Checking if the new email address is valid and reachable. Please wait...
                        </p>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}
