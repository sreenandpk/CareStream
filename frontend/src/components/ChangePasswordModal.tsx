"use client";

import { useState } from "react";
import api from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const [formData, setFormData] = useState({
        old_password: "",
        new_password: "",
        confirm_password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        if (formData.new_password !== formData.confirm_password) {
            setError("New passwords do not match");
            setLoading(false);
            return;
        }

        if (formData.new_password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            await api.post("accounts/change-password/", {
                old_password: formData.old_password,
                new_password: formData.new_password,
            });
            
            setSuccess(true);
            setFormData({ old_password: "", new_password: "", confirm_password: "" });
            
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 2000);

        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.detail || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[480px] bg-white border-none shadow-2xl rounded-[3rem] p-0 overflow-hidden text-zinc-900">
                <DialogHeader className="p-8 pb-4 bg-indigo-50/50 border-b border-indigo-100">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/20">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex flex-col text-left">
                            <DialogTitle className="text-2xl font-black tracking-tight text-zinc-900">
                                Security Registry
                            </DialogTitle>
                            <DialogDescription className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mt-0.5">
                                Authorization Protocol Update
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-10">
                    {success ? (
                        <div className="py-12 text-center animate-in fade-in zoom-in-95 duration-700">
                            <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center border border-emerald-100 shadow-sm mx-auto mb-8 relative">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 stroke-[2px]" />
                                <div className="absolute inset-0 bg-emerald-400/10 rounded-[2.5rem] animate-ping" />
                            </div>
                            <h3 className="text-2xl font-black text-zinc-900 mb-2">Protocol Verified</h3>
                            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">Credentials have been securely <br/>synchronized with the central vault.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {error && (
                                <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 animate-in shake-1 duration-500">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-tight">{error}</p>
                                </div>
                            )}

                            <div className="space-y-6">
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="old-pass" className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Current Authorization</Label>
                                    <Input
                                        id="old-pass"
                                        type="password"
                                        placeholder="Enter current credential"
                                        className="bg-zinc-50 border-none h-14 rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-500/10 font-bold text-zinc-900 placeholder:text-zinc-300 transition-all shadow-inner"
                                        value={formData.old_password}
                                        onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2 text-left">
                                    <Label htmlFor="new-pass" className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">New Security Protocol</Label>
                                    <Input
                                        id="new-pass"
                                        type="password"
                                        placeholder="Min. 6 alphanumeric"
                                        className="bg-zinc-50 border-none h-14 rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-500/10 font-bold text-zinc-900 placeholder:text-zinc-300 transition-all shadow-inner"
                                        value={formData.new_password}
                                        onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2 text-left">
                                    <Label htmlFor="confirm-pass" className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Verify New Protocol</Label>
                                    <Input
                                        id="confirm-pass"
                                        type="password"
                                        placeholder="Confirm new credential"
                                        className="bg-zinc-50 border-none h-14 rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-500/10 font-bold text-zinc-900 placeholder:text-zinc-300 transition-all shadow-inner"
                                        value={formData.confirm_password}
                                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
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
                                    className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        "Commit Updates"
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
