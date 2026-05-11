"use client";

import { useState } from "react";
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
import { Loader2, UserPlus, ShieldCheck } from "lucide-react";

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "NURSE",
        gender: "M",
        phone: "",
        specialization: "",
        license_number: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const payload: any = {
                username: formData.username.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: formData.role,
                gender: formData.gender,
                phone: formData.phone.trim() || null,
            };

            if (formData.role === "DOCTOR") {
                payload.specialization = formData.specialization.trim() || null;
                payload.license_number = formData.license_number.trim() || null;
            }

            await api.post("accounts/create-user/", payload);
            onSuccess();
            onClose();
            setFormData({
                username: "",
                email: "",
                password: "",
                role: "NURSE",
                gender: "M",
                phone: "",
                specialization: "",
                license_number: "",
            });
        } catch (err: any) {
            const data = err.response?.data;
            if (data) {
                const displayMsg = data.error || data.message || data.detail;
                if (displayMsg && typeof displayMsg === 'string') {
                    setError(displayMsg);
                } else if (typeof data === 'object') {
                    const filteredEntries = Object.entries(data).filter(([key]) => 
                        !['success', 'status_code', 'blocked'].includes(key.toLowerCase())
                    );
                    const messages = filteredEntries.map(([field, error]) => {
                        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
                        const errorMessage = Array.isArray(error) ? error[0] : (typeof error === 'object' ? 'Validation failed' : error);
                        return `${fieldName}: ${errorMessage}`;
                    });
                    setError(messages.length > 0 ? messages.join(" | ") : "Validation failed.");
                } else {
                    setError("Validation failed. Please check inputs.");
                }
            } else {
                setError("Network error. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[550px] bg-white border-none text-zinc-900 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-4 bg-zinc-50/50 border-b border-zinc-100">
                    <div className="flex flex-col text-left">
                        <DialogTitle className="text-2xl font-black tracking-tight uppercase">
                            Add New <span className="text-[#5C61F2]">User</span>
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

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 text-left">
                            <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">System Username</Label>
                            <Input
                                id="username"
                                placeholder="clinician_id"
                                className="bg-zinc-50 border-none h-14 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/10 font-bold text-zinc-900 placeholder:text-zinc-300 transition-all"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Professional Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@carestream.hosp"
                                className="bg-zinc-50 border-none h-14 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/10 font-bold text-zinc-900 placeholder:text-zinc-300 transition-all"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Access Protocol (Password)</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="bg-zinc-50 border-none h-14 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/10 font-bold text-zinc-900 placeholder:text-zinc-300 transition-all"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Clinical Designation</Label>
                            <Select 
                                value={formData.role} 
                                onValueChange={(v) => setFormData({ ...formData, role: v })}
                            >
                                <SelectTrigger className="bg-zinc-50 border-none h-14 rounded-2xl focus:ring-2 focus:ring-blue-500/10 font-bold text-zinc-900 px-6 transition-all">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2">
                                    <SelectItem value="DOCTOR" className="rounded-xl font-bold">Medical Practitioner</SelectItem>
                                    <SelectItem value="NURSE" className="rounded-xl font-bold">Nursing Specialist</SelectItem>
                                    <SelectItem value="ADMIN" className="rounded-xl font-bold">System Administrator</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 text-left">
                            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Gender Identification</Label>
                            <Select 
                                value={formData.gender} 
                                onValueChange={(v) => setFormData({ ...formData, gender: v })}
                            >
                                <SelectTrigger className="bg-zinc-50 border-none h-14 rounded-2xl focus:ring-2 focus:ring-blue-500/10 font-bold text-zinc-900 px-6 transition-all">
                                    <SelectValue placeholder="Gender" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2">
                                    <SelectItem value="M" className="rounded-xl font-bold text-zinc-700">Male Identification</SelectItem>
                                    <SelectItem value="F" className="rounded-xl font-bold text-zinc-700">Female Identification</SelectItem>
                                    <SelectItem value="O" className="rounded-xl font-bold text-zinc-700">Non-Binary / Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 text-left">
                            <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Emergency Contact</Label>
                            <Input
                                id="phone"
                                placeholder="+1 (555) 000-0000"
                                className="bg-zinc-50 border-none h-14 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/10 font-bold text-zinc-900 placeholder:text-zinc-300 transition-all"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    {formData.role === "DOCTOR" && (
                        <div className="grid grid-cols-2 gap-6 p-6 bg-blue-50/50 rounded-[2.5rem] border border-blue-100/50 animate-in slide-in-from-top-4 duration-500">
                            <div className="space-y-2 text-left">
                                <Label htmlFor="specialization" className="text-[10px] font-black uppercase text-[#5C61F2] tracking-widest ml-1">Medical Specialization</Label>
                                <Input
                                    id="specialization"
                                    placeholder="e.g. Cardiology"
                                    className="bg-white border-none h-12 rounded-xl font-bold shadow-sm"
                                    value={formData.specialization}
                                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2 text-left">
                                <Label htmlFor="license" className="text-[10px] font-black uppercase text-[#5C61F2] tracking-widest ml-1">Board License #</Label>
                                <Input
                                    id="license"
                                    placeholder="State Medical ID"
                                    className="bg-white border-none h-12 rounded-xl font-bold shadow-sm"
                                    value={formData.license_number}
                                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-3 pt-6 border-t border-zinc-100">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all"
                        >
                            Discard
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex-1"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Authorize Registry"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
