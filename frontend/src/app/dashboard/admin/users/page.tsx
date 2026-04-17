"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { usePresenceStore } from "@/store/presenceStore";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import CreateUserModal from "@/components/CreateUserModal";
import UpdateUserModal from "@/components/UpdateUserModal";
import { toast } from "sonner";
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
    AlertCircle,
    MailX,
    Lock,
    Unlock,
    Shield,
    Terminal
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    phone?: string;
    specialization?: string;
    license_number?: string;
    email_status: "pending" | "valid" | "invalid"; // 🔥 NEW
    is_active: boolean;
    is_locked: boolean;
    is_verified: boolean;
    failed_login_attempts: number;
    date_joined: string;
    last_login: string | null;
    created_at: string;
    updated_at: string;
}

export default function UserManagement() {
    const { user: currentUser, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

    // 🛡️ Hard Access Guard: Redirect non-admins away from this sensitive directory
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
    const { onlineUserIds, setOnlineUsers, lastLogins, updateUserStatus, lastSecurityEvent } = usePresenceStore(); 
    const [isSyncing, setIsSyncing] = useState(false);

    // 🚀 Reactive Security Guardian: Watch for real-time Bounces/Drops
    useEffect(() => {
        if (lastSecurityEvent) {
            // Instant Status Update: Reflect the deactivation in the UI list without a global pop-up
            setUsers(prev => prev.map(u => 
                u.id === lastSecurityEvent.userId 
                ? { ...u, is_active: false, email_status: "invalid" as const, is_verified: false }
                : u
            ));
        }
    }, [lastSecurityEvent]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);

    const syncPresence = async () => {
        setIsSyncing(true);
        try {
            const res = await api.get("accounts/online-users/");
            const sessionData = res.data.online_users;
            if (Array.isArray(sessionData)) {
                // Extract IDs of staff members with active sessions, ensuring Number type
                const ids = sessionData.map((s: any) => Number(s.user)).filter(id => !isNaN(id));
                setOnlineUsers(ids);
            }
        } catch (err) {
            console.error("Sync Presence error", err);
        } finally {
            setTimeout(() => setIsSyncing(false), 800);
        }
    };

    // Debounce search query
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
            syncPresence(); // Automatically sync presence on mount/tab change
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
            
            // Handle paginated response
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
            setUsers([]); // Ensure users is never undefined
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
        // 🇮🇳 Regional Polish: Wed, 14/04/2026, 11:47 PM
        return date.toLocaleString("en-IN", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    };

    if (!_hasHydrated || !currentUser) return null;

    return (
        <DashboardShell>
            <div className="p-8 space-y-8 min-h-screen bg-zinc-950/20">
                <div className="flex flex-col gap-6">
                    {/* 📠 Clean Terminal Header */}
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-8">
                        <div className="flex items-center gap-5">
                            <button 
                                onClick={() => router.push(currentUser.role === "ADMIN" ? "/dashboard/admin" : 
                                                         currentUser.role === "DOCTOR" ? "/dashboard/doctor" : "/dashboard/nurse")}
                                className="p-3 hover:bg-zinc-900 rounded-xl border border-transparent hover:border-zinc-800 transition-all group"
                            >
                                <ChevronLeft className="w-5 h-5 text-zinc-500 group-hover:text-white" />
                            </button>
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="bg-zinc-900 p-1 rounded border border-zinc-800">
                                        <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                                    </div>
                                    <span className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-widest leading-none">
                                        SYSTEM_DIRECTORY_INDEX
                                    </span>
                                </div>
                                <h1 className="text-4xl font-black tracking-tight text-white uppercase font-mono">
                                    {currentUser.role === "ADMIN" ? "User_Directory" : "Staff_Directory"}
                                </h1>
                                <p className="text-zinc-500 font-mono text-[10px] italic mt-1 uppercase tracking-tighter">
                                    Strategic staff management and high-fidelity session auditing.
                                </p>
                            </div>
                        </div>

                        {currentUser.role === "ADMIN" && (
                            <Button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-zinc-900 hover:bg-white hover:text-black border border-zinc-800 text-zinc-300 font-mono font-black h-12 px-6 rounded-xl transition-all shadow-xl"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                REGISTER_STAFF
                            </Button>
                        )}
                    </div>

                    <Tabs 
                        defaultValue="ACTIVE" 
                        value={activeTab} 
                        onValueChange={(v) => { setActiveTab(v as any); setCurrentPage(1); }}
                        className="space-y-6"
                    >
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1 rounded-xl h-auto">
                                <TabsTrigger value="ACTIVE" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white px-6 font-mono text-[11px] font-bold">
                                    /active
                                </TabsTrigger>
                                {currentUser?.role === 'ADMIN' && (
                                    <>
                                        <TabsTrigger value="DEACTIVATED" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-rose-400 px-6 font-mono text-[11px] font-bold">
                                            /deactivated
                                        </TabsTrigger>
                                        <TabsTrigger value="LOCKED" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 px-6 font-mono text-[11px] font-bold">
                                            /locked
                                        </TabsTrigger>
                                    </>
                                )}
                            </TabsList>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={syncPresence}
                                    disabled={isSyncing}
                                    className={`p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all ${isSyncing ? 'animate-spin' : ''}`}
                                    title="Sync Online"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'text-blue-500' : 'text-zinc-500'}`} />
                                </button>
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-600" />
                                    <Input 
                                        className="bg-black/60 border-zinc-800 pl-11 h-11 focus-visible:ring-zinc-700 font-mono text-xs placeholder:text-zinc-800"
                                        placeholder="FILTER_BY_IDENTITY_OR_ROLE..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <Card className="bg-black/40 border-zinc-800/50 shadow-2xl backdrop-blur-md overflow-hidden">
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="h-[400px] flex flex-col items-center justify-center text-zinc-600 gap-4">
                                        <RefreshCw className="w-10 h-10 animate-spin text-zinc-800" />
                                        <p className="text-[10px] font-mono font-black uppercase tracking-[0.2em] animate-pulse">Syncing_with_primary_node...</p>
                                    </div>
                                ) : users.length === 0 ? (
                                    <div className="h-[400px] flex flex-col items-center justify-center text-zinc-800 gap-4">
                                        <Users className="w-16 h-16 opacity-10" />
                                        <p className="text-[10px] font-mono font-black uppercase tracking-widest">_EMPTY_DATA_SET</p>
                                    </div>
                                ) : (
                                    <>
                                    <Table>
                                        <TableHeader className="bg-zinc-900/40 border-b border-zinc-800">
                                            <TableRow className="hover:bg-transparent border-none">
                                                <TableHead className="w-[240px] font-mono text-[10px] font-black py-5 text-zinc-500 uppercase tracking-widest pl-8">STAFF_IDENTITY</TableHead>
                                                <TableHead className="font-mono text-[10px] font-black w-[130px] text-zinc-500 uppercase tracking-widest">DESIGNATION</TableHead>
                                                <TableHead className="font-mono text-[10px] font-black text-zinc-500 uppercase tracking-widest">CLINICAL_DATA</TableHead>
                                                <TableHead className="font-mono text-[10px] font-black w-[280px] text-zinc-500 uppercase tracking-widest">SESSION_LOGS</TableHead>
                                                <TableHead className="font-mono text-[10px] font-black w-[140px] text-zinc-500 uppercase tracking-widest">STATUS</TableHead>
                                                {currentUser.role === "ADMIN" && <TableHead className="text-right font-mono text-[10px] font-black pr-10 text-zinc-500 uppercase tracking-widest">ACTIONS</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.map((u) => (
                                                <TableRow key={u.id} className="border-zinc-900 hover:bg-white/5 transition-all group">
                                                    <TableCell className="pl-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative flex-shrink-0">
                                                                <div className="w-11 h-11 rounded-full border border-zinc-800 overflow-hidden bg-black group-hover:border-zinc-700 transition-all">
                                                                    <img 
                                                                        src="/assets/avatar-placeholder.svg" 
                                                                        alt={u.username}
                                                                        className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all scale-110"
                                                                    />
                                                                </div>
                                                                {onlineUserIds.has(Number(u.id)) && (
                                                                    <div className="absolute right-0 bottom-0 w-3 h-3 bg-zinc-950 rounded-full flex items-center justify-center border border-zinc-900">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-[13px] font-black text-zinc-200 uppercase tracking-tight">{u.username}</span>
                                                                    {u.is_verified && u.email_status !== "invalid" && (
                                                                        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                                                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                                                            VERIFIED
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] text-zinc-600 font-mono mt-0.5 lowercase">{u.email}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="bg-zinc-900 text-zinc-400 font-mono font-bold px-3 py-1 border border-zinc-800 text-[9px] tracking-widest">
                                                            {u.role}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1 font-mono text-[11px]">
                                                            {u.phone ? (
                                                                <span className="text-zinc-500">COMMS: {u.phone}</span>
                                                            ) : (
                                                                <span className="text-zinc-800 text-[10px] uppercase">_NO_LINK</span>
                                                            )}
                                                            {u.role === 'DOCTOR' && (
                                                                <div className="flex flex-col gap-0.5 mt-1">
                                                                    <span className="text-[10px] text-blue-400/80 font-black uppercase">{u.specialization}</span>
                                                                    <span className="text-[9px] text-zinc-700">CERT: {u.license_number}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1.5 font-mono text-[9px] tracking-tight">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-zinc-700 uppercase w-12">JOINED:</span>
                                                                <span className="text-zinc-500 font-bold whitespace-nowrap">
                                                                    {formatDate(u.created_at)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-zinc-700 uppercase w-12">ACTIVE:</span>
                                                                <span className="text-emerald-500/80 font-bold whitespace-nowrap">
                                                                    {formatDate(lastLogins[u.id] || u.last_login)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1 w-fit font-mono">
                                                            {/* Live Presence Readout */}
                                                            <div className="flex items-center gap-2 px-1.5 py-1 bg-zinc-900/40 rounded border border-zinc-900/50">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${onlineUserIds.has(Number(u.id)) ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-zinc-800'}`}></div>
                                                                <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${onlineUserIds.has(Number(u.id)) ? 'text-emerald-500/80' : 'text-zinc-700'}`}>
                                                                    {onlineUserIds.has(Number(u.id)) ? 'Online' : 'Offline'}
                                                                </span>
                                                            </div>

                                                            {u.is_locked && (
                                                                <div className="bg-amber-900/10 text-amber-500 border border-amber-500/20 px-1.5 py-1 rounded flex items-center gap-2 text-[10px] font-black uppercase tracking-tight mt-1">
                                                                    <Lock className="w-2.5 h-2.5" /> LOCKED
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={currentUser.role === "ADMIN" ? "text-right pr-10" : "hidden"}>
                                                        <div className="flex justify-end gap-3">
                                                            {currentUser.role === 'ADMIN' && (
                                                                <>
                                                                    {u.role !== 'ADMIN' || u.id === currentUser.id ? (
                                                                        <Button 
                                                                            variant="outline" 
                                                                            size="icon"
                                                                            onClick={() => {
                                                                                setSelectedUser(u);
                                                                                setIsUpdateModalOpen(true);
                                                                            }}
                                                                            className="h-10 w-10 bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                                                                            title="Edit Profile"
                                                                        >
                                                                            <Pencil className="w-4 h-4" />
                                                                        </Button>
                                                                    ) : (
                                                                        <div className="h-10 w-10 flex items-center justify-center opacity-20 border border-zinc-800 rounded-lg">
                                                                            <Shield className="w-4 h-4 text-zinc-700" />
                                                                        </div>
                                                                    )}

                                                                    {u.role !== 'ADMIN' && (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => toggleUserStatus(u)}
                                                                            className={`h-10 px-4 font-mono font-black text-[9px] uppercase tracking-widest border transition-all ${
                                                                                u.is_active 
                                                                                ? "text-rose-500 border-rose-500/20 hover:bg-rose-500/10" 
                                                                                : "text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10"
                                                                            }`}
                                                                        >
                                                                            {u.is_active ? "DEACTIVATE" : "ACTIVATE"}
                                                                        </Button>
                                                                    )}

                                                                    {u.is_locked && (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => unlockUser(u.id)}
                                                                            className="h-10 px-4 font-mono font-black text-[9px] uppercase tracking-widest border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                                                                        >
                                                                            RESTORE_ACCESS
                                                                        </Button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    
                                    {/* Clean Terminal Footer */}
                                    <div className="flex items-center justify-between px-8 py-5 bg-zinc-900/40 border-t border-zinc-900/50 backdrop-blur-md">
                                        <div className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-700">
                                            Records: <span className="text-zinc-500">{users?.length || 0}</span> / {totalResults}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(prev => prev - 1)}
                                                className="h-9 font-mono font-black text-[10px] uppercase bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800 disabled:opacity-20 transition-all px-4"
                                            >
                                                _PREV
                                            </Button>
                                            <div className="flex items-center gap-2 mx-4 font-mono font-black text-[10px]">
                                                <span className="text-zinc-200 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-md">{currentPage}</span>
                                                <span className="text-zinc-800">::</span>
                                                <span className="text-zinc-600">{totalPages}</span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage(prev => prev + 1)}
                                                className="h-9 font-mono font-black text-[10px] uppercase bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800 disabled:opacity-20 transition-all px-4"
                                            >
                                                _NEXT
                                            </Button>
                                        </div>
                                    </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Tabs>
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
        </DashboardShell>
    );
}
