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
import { Loader2, ShieldCheck, Mail, Pencil, UserCircle } from "lucide-react";

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
    gender: "M" | "F" | "O";
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
        gender: "M",
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
                gender: user.gender || "M",
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
                gender: formData.gender,
                phone: formData.phone.trim() || null,
            };

            if (formData.role === "DOCTOR") {
                payload.specialization = formData.specialization.trim() || null;
                payload.license_number = formData.license_number.trim() || null;
            }

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
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[550px] bg-white border-none text-zinc-900 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-4 bg-zinc-50/50 border-b border-zinc-100">
                    <div className="flex flex-col text-left">
                        <DialogTitle className="text-2xl font-black tracking-tight text-zinc-900 uppercase">
                            {showOtpInput ? "Identity Verification" : "Update "}
                            {!showOtpInput && <span className="text-[#5C61F2]">User</span>}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-8">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider leading-tight">{error}</p>
                        </div>
                    )}

                    {!showOtpInput ? (
                        <div className="space-y-6">
                            <div className="space-y-2 text-left">
                                <Label htmlFor="edit-email" className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Email Address</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    className="bg-zinc-50 border-none h-14 rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-500/10 font-bold text-zinc-900 placeholder:text-zinc-300 transition-all disabled:opacity-50"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    disabled={loading || user.role === 'ADMIN'}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2 text-left">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Gender</Label>
                                    <Select 
                                        value={formData.gender} 
                                        onValueChange={(v) => setFormData({ ...formData, gender: v as any })}
                                        disabled={loading}
                                    >
                                        <SelectTrigger className="bg-zinc-50 border-none h-14 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 font-bold text-zinc-900 px-6 transition-all">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2">
                                            <SelectItem value="M" className="rounded-xl font-bold">Male</SelectItem>
                                            <SelectItem value="F" className="rounded-xl font-bold">Female</SelectItem>
                                            <SelectItem value="O" className="rounded-xl font-bold">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 text-left">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Role</Label>
                                    <Select 
                                        value={formData.role} 
                                        onValueChange={(v) => setFormData({ ...formData, role: v })}
                                        disabled={loading || user.role === 'ADMIN'}
                                    >
                                        <SelectTrigger className="bg-zinc-50 border-none h-14 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 font-bold text-zinc-900 px-6 transition-all disabled:opacity-50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2">
                                            <SelectItem value="ADMIN" className="rounded-xl font-bold">Admin</SelectItem>
                                            <SelectItem value="DOCTOR" className="rounded-xl font-bold">Doctor</SelectItem>
                                            <SelectItem value="NURSE" className="rounded-xl font-bold">Nurse</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2 space-y-2 text-left">
                                    <Label htmlFor="edit-phone" className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Phone Number</Label>
                                    <Input
                                        id="edit-phone"
                                        className="bg-zinc-50 border-none h-14 rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-500/10 font-bold text-zinc-900 placeholder:text-zinc-300 transition-all"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+1 (555) 000-0000"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {formData.role === "DOCTOR" && (
                                <div className="p-6 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100/50 space-y-4 animate-in slide-in-from-top-4 duration-500">
                                    <h3 className="text-[10px] font-black text-[#5C61F2] uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                                        Clinical Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2 text-left">
                                            <Label htmlFor="edit-spec" className="text-[10px] uppercase font-black text-zinc-400 ml-1">Specialization</Label>
                                            <Input
                                                id="edit-spec"
                                                placeholder="e.g. ICU"
                                                className="bg-white border-none h-12 rounded-xl font-bold shadow-sm"
                                                value={formData.specialization}
                                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="space-y-2 text-left">
                                            <Label htmlFor="edit-license" className="text-[10px] uppercase font-black text-zinc-400 ml-1">Board License #</Label>
                                            <Input
                                                id="edit-license"
                                                placeholder="State Medical ID"
                                                className="bg-white border-none h-12 rounded-xl font-bold shadow-sm"
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
                        <div className="space-y-8 py-8 text-center animate-in fade-in zoom-in-95 duration-500">
                            <div className="flex flex-col items-center space-y-6">
                                <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center border border-emerald-100 shadow-sm relative">
                                    <Mail className="w-10 h-10 text-emerald-500" />
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white">
                                        <ShieldCheck className="w-3 h-3 text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2 px-6">
                                    <p className="text-zinc-500 font-bold text-sm leading-relaxed">
                                        A clinical verification code has been dispatched to <br/>
                                        <span className="text-emerald-600 font-black underline decoration-2 underline-offset-4">{formData.email}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 px-12">
                                <Label htmlFor="otp-input" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block text-center">6-Digit Identity Code</Label>
                                <Input
                                    id="otp-input"
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    className="bg-zinc-50 border-none text-center text-5xl font-black tracking-[0.5em] h-24 rounded-[2.5rem] focus:ring-2 focus:ring-emerald-500/10 text-zinc-900 shadow-inner"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                    required
                                    autoFocus
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-3 pt-6 border-t border-zinc-100">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => showOtpInput ? setShowOtpInput(false) : onClose()}
                            className="h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all"
                            disabled={loading}
                        >
                            Discard
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || (showOtpInput && otp.length !== 6)}
                            className={`h-14 px-10 shadow-xl rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex-1 ${
                                showOtpInput 
                                ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white" 
                                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 text-white"
                            }`}
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                showOtpInput ? "Authorize" : "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                    {showOtpInput && (
                        <p className="text-[9px] text-center text-amber-500 font-black uppercase tracking-[0.2em] animate-pulse">
                            Security Protocol in Progress...
                        </p>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Dummy Icon for Award
function Award({ className }: { className?: string }) {
    return <UserCircle className={className} />;
}
