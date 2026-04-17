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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden">
                <div className="bg-gradient-to-b from-blue-500/10 to-transparent p-6 pb-0">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                           <div className="p-2 bg-blue-500/10 rounded-lg">
                               <ShieldCheck className="w-5 h-5 text-blue-400" />
                           </div>
                           <DialogTitle className="text-xl font-bold">Security Settings</DialogTitle>
                        </div>
                        <DialogDescription className="text-zinc-500 text-left">
                            Update your credentials to maintain account security.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    {success ? (
                        <div className="py-12 text-center animate-in fade-in zoom-in-95 duration-500">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 stroke-[1.5px]" />
                            <h3 className="text-xl font-bold text-white mb-2">Credentials Updated</h3>
                            <p className="text-emerald-500/70 text-sm">Your new password has been saved.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-lg flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="old-pass" className="text-xs uppercase tracking-widest font-bold text-zinc-500 ml-1">Current Password</Label>
                                    <Input
                                        id="old-pass"
                                        type="password"
                                        className="bg-zinc-900 border-zinc-800 h-11"
                                        value={formData.old_password}
                                        onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="h-px bg-zinc-900" />

                                <div className="space-y-2">
                                    <Label htmlFor="new-pass" className="text-xs uppercase tracking-widest font-bold text-zinc-500 ml-1">New Password</Label>
                                    <Input
                                        id="new-pass"
                                        type="password"
                                        className="bg-zinc-900 border-zinc-800 h-11 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50"
                                        value={formData.new_password}
                                        onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-pass" className="text-xs uppercase tracking-widest font-bold text-zinc-500 ml-1">Confirm New Password</Label>
                                    <Input
                                        id="confirm-pass"
                                        type="password"
                                        className="bg-zinc-900 border-zinc-800 h-11 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50"
                                        value={formData.confirm_password}
                                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-all shadow-xl shadow-white/5"
                            >
                                {loading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                                ) : (
                                    "Update Password"
                                )}
                            </Button>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
