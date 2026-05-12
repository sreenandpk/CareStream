"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { usePresenceStore } from "@/store/presenceStore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import CreateUserModal from "@/components/CreateUserModal";
import UpdateUserModal from "@/components/UpdateUserModal";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Users, 
    UserPlus, 
    Search, 
    RefreshCw, 
    ChevronLeft, 
    ChevronRight, 
    Pencil, 
    CheckCircle2, 
    Shield,
    MoreHorizontal,
    Mail,
    Phone,
    Award,
    Clock,
    UserCheck,
    UserX,
    Lock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    phone?: string;
    specialization?: string;
    license_number?: string;
    email_status: "pending" | "valid" | "invalid";
    is_active: boolean;
    is_locked: boolean;
    is_verified: boolean;
    failed_login_attempts: number;
    date_joined: string;
    last_login: string | null;
    created_at: string;
    updated_at: string;
    gender: "M" | "F" | "O";
}

export default function UserManagement() {
    const { user: currentUser, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

    useEffect(() => {
        if (_hasHydrated) {
            if (!currentUser || currentUser.role !== "ADMIN") {
                const redirectPath = currentUser?.role === "DOCTOR" ? "/dashboard/doctor" : 
                                   currentUser?.role === "NURSE" ? "/dashboard/nurse" : "/login";
                router.push(redirectPath);
            }
        }
    }, [currentUser, _hasHydrated, router]);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<"ACTIVE" | "DEACTIVATED" | "LOCKED">("ACTIVE");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const { onlineUserIds, setOnlineUsers, lastLogins, lastSecurityEvent } = usePresenceStore(); 
    const [isSyncing, setIsSyncing] = useState(false);
    const lastHandledEventRef = useRef<number | null>(null);

    useEffect(() => {
        if (lastSecurityEvent && lastSecurityEvent.timestamp !== lastHandledEventRef.current) {
            lastHandledEventRef.current = lastSecurityEvent.timestamp;
            
            const isInvalid = lastSecurityEvent.status === "invalid";

            setUsers(prev => {
                const updated = prev.map(u => 
                    u.id === lastSecurityEvent.userId 
                    ? { 
                        ...u, 
                        is_active: !isInvalid, 
                        email_status: lastSecurityEvent.status as any, 
                        is_verified: !isInvalid 
                      }
                    : u
                );

                // 🚀 INSTANT TAB SYNC: If we are on the ACTIVE tab and user is INVALID, remove them
                if (activeTab === "ACTIVE" && isInvalid) {
                    return updated.filter(u => u.id !== lastSecurityEvent.userId);
                }
                
                return updated;
            });

            // 🚨 SHOW THE MESSAGE: Premium Identity Shield Alert
            if (isInvalid) {
                toast.error("Identity Shield Alert", {
                    description: `Email ${lastSecurityEvent.email} is undeliverable. Account automatically deactivated.`,
                    duration: 3000,
                    icon: <Shield className="w-5 h-5 text-destructive" />,
                    style: {
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid var(--destructive)',
                        borderRadius: '12px',
                        padding: '16px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    },
                });
            } else {
                toast.success("Identity Verified", {
                    description: `Email ${lastSecurityEvent.email} has been verified successfully.`,
                    duration: 3000,
                });
            }
        }
    }, [lastSecurityEvent, activeTab]);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);

    const syncPresence = async () => {
        setIsSyncing(true);
        try {
            const res = await api.get("accounts/online-users/");
            const sessionData = res.data.online_users;
            if (Array.isArray(sessionData)) {
                const ids = sessionData.map((s: any) => Number(s.user)).filter(id => !isNaN(id));
                setOnlineUsers(ids);
            }
        } catch (err) {
            console.error("Sync Presence error", err);
        } finally {
            setTimeout(() => setIsSyncing(false), 800);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (_hasHydrated && currentUser?.role === "ADMIN") {
            fetchUsers();
            syncPresence();
        }
    }, [currentUser, _hasHydrated, activeTab, debouncedSearch, currentPage]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", currentPage.toString());
            
            if (activeTab === "ACTIVE") {
                params.append("is_active", "true");
            } else if (activeTab === "DEACTIVATED") {
                params.append("is_active", "false");
            } else if (activeTab === "LOCKED") {
                params.append("is_locked", "true");
            }

            if (debouncedSearch) {
                params.append("search", debouncedSearch);
            }

            const res = await api.get(`accounts/users/?${params.toString()}`);
            
            if (res.data.results) {
                setUsers(res.data.results);
                setTotalPages(res.data.total_pages);
                setTotalResults(res.data.count);
            } else {
                setUsers(res.data.data || []);
                setTotalPages(1);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (u: User) => {
        try {
            if (u.is_active) {
                await api.patch(`accounts/users/${u.id}/deactivate/`);
            } else {
                await api.put(`accounts/users/${u.id}/update/`, { is_active: true });
            }
            fetchUsers();
        } catch (error) {
            console.error("Failed to toggle status", error);
        }
    };

    const unlockUser = async (id: number) => {
        try {
            await api.patch(`accounts/users/${id}/unlock/`);
            fetchUsers();
        } catch (error) {
            console.error("Failed to unlock user", error);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Never";
        const date = new Date(dateString);
        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    };


    if (!_hasHydrated || !currentUser) return null;

    return (
        <div className="p-10 pt-16 space-y-12 min-h-screen bg-zinc-50/30 w-full max-w-[1600px] mx-auto text-left">
            {/* 🛡️ PREMIUM HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex flex-col text-left">
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 leading-none uppercase">
                        Team <span className="text-[#5C61F2]">Members</span>
                    </h1>
                </div>

                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-[#5C61F2] hover:bg-[#4A4ED4] text-white shadow-xl shadow-[#5C61F2]/20 h-16 px-10 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 border-none"
                >
                    Add New User
                </Button>
            </div>

            {/* 📋 TACTICAL METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="group relative bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-100/50 transition-colors" />
                    <div className="relative z-10 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                            <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                        <p className="text-4xl font-black text-zinc-900 tracking-tight leading-none mb-2">{users.length}</p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Registered Personnel</p>
                    </div>
                </div>

                <div className="group relative bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/30 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-100/50 transition-colors" />
                    <div className="relative z-10 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                            <UserCheck className="w-6 h-6 text-emerald-600" />
                        </div>
                        <p className="text-4xl font-black text-zinc-900 tracking-tight leading-none mb-2">{onlineUserIds.size}</p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Currently Authenticated</p>
                    </div>
                </div>

                <div className="group relative bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/30 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-100/50 transition-colors" />
                    <div className="relative z-10 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                            <Lock className="w-6 h-6 text-amber-600" />
                        </div>
                        <p className="text-4xl font-black text-zinc-900 tracking-tight leading-none mb-2">{users.filter(u => u.is_locked).length}</p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Locked Credentials</p>
                    </div>
                </div>

                <div className="group relative bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/30 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-rose-100/50 transition-colors" />
                    <div className="relative z-10 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20 group-hover:scale-110 transition-transform duration-500">
                            <UserX className="w-6 h-6 text-rose-600" />
                        </div>
                        <p className="text-4xl font-black text-zinc-900 tracking-tight leading-none mb-2">{users.filter(u => !u.is_active).length}</p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Inactive Accounts</p>
                    </div>
                </div>
            </div>

            {/* 🔍 FILTER & SEARCH */}
            <div className="flex flex-col lg:flex-row items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full lg:w-fit">
                    <TabsList className="bg-zinc-50 p-1.5 h-16 rounded-2xl border-none gap-2">
                        <TabsTrigger value="ACTIVE" className="h-full rounded-xl px-8 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm border-none">Active Personnel</TabsTrigger>
                        <TabsTrigger value="DEACTIVATED" className="h-full rounded-xl px-8 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-sm border-none">Deactivated</TabsTrigger>
                        <TabsTrigger value="LOCKED" className="h-full rounded-xl px-8 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm border-none">Locked</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                        placeholder="PERSONNEL TRACE: NAME, EMAIL, ROLE, OR CREDENTIAL UID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 bg-zinc-50 border-none focus-visible:ring-0 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 h-16 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest text-zinc-900 placeholder:text-zinc-400"
                    />
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fetchUsers()}
                    className="bg-zinc-50 border border-zinc-100 hover:bg-indigo-50 text-zinc-400 hover:text-indigo-600 h-16 w-16 rounded-2xl transition-all active:scale-95 shadow-sm"
                    title="Audit Identity Registry"
                >
                    <RefreshCw className={cn("w-5 h-5", isSyncing && "animate-spin")} />
                </Button>
            </div>

            {/* 📋 PERSONNEL REGISTRY TABLE */}
            <div className="bg-white border border-zinc-100 rounded-[3rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto text-left">
                    <Table>
                        <TableHeader className="bg-zinc-50/50">
                            <TableRow className="border-zinc-100 hover:bg-transparent">
                                <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Personnel Identity</TableHead>
                                <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Contact Matrix</TableHead>
                                <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10 text-center">Auth State</TableHead>
                                <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Administrative Role</TableHead>
                                <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10 text-right">Operations</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i} className="border-zinc-100 hover:bg-transparent">
                                        <TableCell className="pl-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <Skeleton className="w-16 h-16 rounded-2xl bg-zinc-50" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32 bg-zinc-50" />
                                                    <Skeleton className="h-3 w-48 bg-zinc-50" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell><Skeleton className="h-10 w-32 bg-zinc-50 rounded-xl" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-32 bg-zinc-50 rounded-xl" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-28 bg-zinc-50 rounded-lg" /></TableCell>
                                        <TableCell className="text-right pr-10">
                                            <div className="flex justify-end gap-3">
                                                <Skeleton className="h-12 w-12 rounded-2xl bg-zinc-50" />
                                                <Skeleton className="h-12 w-28 rounded-2xl bg-zinc-50" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-96 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <Users className="w-16 h-16 text-zinc-100 animate-pulse" />
                                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-300">Registry Segment Null</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((u) => (
                                    <TableRow key={u.id} className="border-zinc-100 hover:bg-zinc-50/40 transition-all group">
                                        <TableCell className="pl-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="relative flex-shrink-0">
                                                    <div className="w-16 h-16 rounded-2xl border-none shadow-sm overflow-hidden bg-indigo-50/50 group-hover:shadow-lg transition-all flex items-center justify-center">
                                                        <span className="text-xl font-black text-indigo-400">{u.username.charAt(0)}</span>
                                                    </div>
                                                    {onlineUserIds.has(Number(u.id)) && (
                                                        <div className="absolute -right-1 -bottom-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col text-left">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base font-black text-zinc-900 tracking-tight leading-none uppercase">{u.username}</span>
                                                        {u.is_verified && (
                                                            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Mail className="w-3.5 h-3.5 text-zinc-300" />
                                                        <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mr-2">{u.email}</span>
                                                        <Badge className={cn(
                                                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-md border-none",
                                                            u.email_status === 'valid' ? "bg-emerald-100 text-emerald-600" :
                                                            u.email_status === 'pending' ? "bg-amber-100 text-amber-600 animate-pulse" :
                                                            "bg-rose-100 text-rose-600"
                                                        )}>
                                                            {u.email_status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2 text-left">
                                                {u.phone ? (
                                                    <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                                                        <Phone className="w-3.5 h-3.5 text-zinc-300" />
                                                        {u.phone}
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">No Contact Registry</span>
                                                )}
                                                {u.role === 'DOCTOR' && u.specialization && (
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg w-fit border border-indigo-100/50">
                                                        <Award className="w-3.5 h-3.5" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">{u.specialization}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2 text-left">
                                                <div className={`flex items-center gap-2.5 px-4 py-1.5 rounded-xl w-fit border shadow-sm transition-all ${
                                                    onlineUserIds.has(Number(u.id)) 
                                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                                    : 'bg-zinc-50 border-zinc-100 text-zinc-400 opacity-60'
                                                }`}>
                                                    <div className={`w-2 h-2 rounded-full ${onlineUserIds.has(Number(u.id)) ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`}></div>
                                                    <span className="text-[9px] font-black uppercase tracking-[0.15em]">
                                                        {onlineUserIds.has(Number(u.id)) ? 'Session Active' : 'Protocol Disconnected'}
                                                    </span>
                                                </div>
                                                {u.is_locked && (
                                                    <Badge className="bg-rose-50 text-rose-600 border-rose-100 text-[9px] font-black uppercase tracking-widest w-fit py-1 px-3 rounded-lg shadow-sm">
                                                        <Lock className="w-3 h-3 mr-1.5" /> Access Locked
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`font-black px-4 py-1.5 text-[9px] uppercase tracking-[0.2em] rounded-lg border-none shadow-sm ${
                                                u.role === 'ADMIN' ? 'bg-indigo-600 text-white shadow-indigo-600/20' :
                                                u.role === 'DOCTOR' ? 'bg-amber-100 text-amber-700' :
                                                'bg-emerald-100 text-emerald-700'
                                            }`}>
                                                {u.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-10">
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedUser(u);
                                                        setIsUpdateModalOpen(true);
                                                    }}
                                                    className="h-12 w-12 bg-zinc-50 border border-zinc-100 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </Button>

                                                {u.role !== 'ADMIN' && (
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => toggleUserStatus(u)}
                                                        className={`h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border ${
                                                            u.is_active 
                                                            ? "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white" 
                                                            : "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                                                        }`}
                                                    >
                                                        {u.is_active ? <><UserX className="w-4 h-4 mr-2" /> Deauthorize</> : <><UserCheck className="w-4 h-4 mr-2" /> Authorize</>}
                                                    </Button>
                                                )}

                                                {u.is_locked && (
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => unlockUser(u.id)}
                                                        className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        Restore Protocol
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* 📟 Elegant Footer */}
                <div className="flex items-center justify-between px-10 py-10 bg-zinc-50/40 border-t border-zinc-100">
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        Registry Population: <span className="text-zinc-900">{users?.length || 0}</span> / {totalResults} Identified
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-400 hover:bg-white hover:text-zinc-900 disabled:opacity-20 transition-all px-6"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Previous Trace
                        </Button>
                        <div className="flex items-center gap-3">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-10 h-10 rounded-xl text-[11px] font-black transition-all ${
                                        currentPage === i + 1 
                                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-110' 
                                        : 'text-zinc-400 hover:bg-white hover:text-zinc-900 border border-transparent hover:border-zinc-100'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-400 hover:bg-white hover:text-zinc-900 disabled:opacity-20 transition-all px-6"
                        >
                            Next Trace
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>

            <CreateUserModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={fetchUsers}
            />

            <UpdateUserModal
                isOpen={isUpdateModalOpen}
                onClose={() => {
                    setIsUpdateModalOpen(false);
                    setSelectedUser(null);
                }}
                onSuccess={fetchUsers}
                user={selectedUser}
            />
        </div>
    );
}
