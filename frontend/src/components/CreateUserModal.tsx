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
import { Loader2 } from "lucide-react";

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
                phone: "",
                specialization: "",
                license_number: "",
            });
        } catch (err: any) {
            const data = err.response?.data;
            
            // 🛡️ Professional Error Parsing: Show only the "needed" error message
            if (data) {
                // 1. Prioritize direct error or message fields
                const displayMsg = data.error || data.message || data.detail;
                if (displayMsg && typeof displayMsg === 'string') {
                    setError(displayMsg);
                } 
                // 2. Handle validation dictionaries (field-specific errors)
                else if (typeof data === 'object') {
                    const filteredEntries = Object.entries(data).filter(([key]) => 
                        !['success', 'status_code', 'blocked'].includes(key.toLowerCase())
                    );
                    
                    const messages = filteredEntries.map(([field, error]) => {
                        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
                        const errorMessage = Array.isArray(error) ? error[0] : (typeof error === 'object' ? 'Validation failed' : error);
                        return `${fieldName}: ${errorMessage}`;
                    });
                    
                    setError(messages.length > 0 ? messages.join(" | ") : "Identity validation failed.");
                } else {
                    setError("Identity validation failed. Please check inputs.");
                }
            } else {
                setError("Network error or server timeout. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight">Create New User</DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Register a new staff member to the CareStream system.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm rounded-lg animate-in fade-in zoom-in-95">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="username" className="text-zinc-400">Username</Label>
                            <Input
                                id="username"
                                className="bg-zinc-900 border-zinc-800 focus:ring-blue-500/20"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="email" className="text-zinc-400">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                className="bg-zinc-900 border-zinc-800 focus:ring-blue-500/20"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-zinc-400">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                className="bg-zinc-900 border-zinc-800 focus:ring-blue-500/20"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Role</Label>
                            <Select 
                                value={formData.role} 
                                onValueChange={(v) => setFormData({ ...formData, role: v })}
                            >
                                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                    <SelectItem value="DOCTOR">Doctor</SelectItem>
                                    <SelectItem value="NURSE">Nurse</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {formData.role === "DOCTOR" && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 animate-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <Label htmlFor="specialization" className="text-xs font-bold text-blue-400">Specialization</Label>
                                <Input
                                    id="specialization"
                                    className="bg-zinc-900 border-zinc-800 h-9"
                                    value={formData.specialization}
                                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="license" className="text-xs font-bold text-blue-400">License #</Label>
                                <Input
                                    id="license"
                                    className="bg-zinc-900 border-zinc-800 h-9"
                                    value={formData.license_number}
                                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12"
                        >
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                            ) : (
                                "Create User"
                            )}
                        </Button>
                    </DialogFooter>
                    {loading && (
                        <p className="text-[11px] text-center text-blue-400 font-mono animate-pulse mt-2">
                            Checking if the email address is valid and reachable. Please wait...
                        </p>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}
