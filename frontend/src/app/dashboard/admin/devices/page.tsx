"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw, Cpu, Activity, Wifi, ShieldAlert, WifiOff, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import DeviceTable from "@/components/devices/DeviceTable";
import DeviceDialog from "@/components/devices/DeviceDialog";
import DeviceDeleteDialog from "@/components/devices/DeviceDeleteDialog";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Bed {
  id: number;
  bed_number: string;
}

interface Device {
  id: number;
  serial_number: string;
  bed: number;
  bed_number: string;
  room_number: string;
  ward_name: string;
  patient_name?: string;
  device_type: string;
  status: "ACTIVE" | "OFFLINE" | "MAINTENANCE" | "ERROR";
  mode: "REAL" | "SIMULATION";
  simulation_mode: string;
  firmware_version?: string;
  ip_address?: string;
  last_seen?: string;
  is_active: boolean;
  masked_key?: string;
  key_created_at?: string;
  is_key_revoked?: boolean;
  api_key?: string;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [devicesRes, bedsRes] = await Promise.all([
        api.get("devices/admin/devices/"),
        api.get("beds/admin/beds/")
      ]);

      if (devicesRes.data.success) {
        setDevices(devicesRes.data.data || devicesRes.data.results || []);
      }
      if (bedsRes.data.success) {
        setBeds(bedsRes.data.data || bedsRes.data.results || []);
      }
    } catch (error) {
      toast.error("Failed to sync devices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = devices.filter((device) => {
      const bedNum = getBedNumber(device.bed).toLowerCase();
      return (
        device.serial_number.toLowerCase().includes(query) ||
        device.ip_address?.toLowerCase().includes(query) ||
        device.device_type.toLowerCase().includes(query) ||
        bedNum.includes(query)
      );
    });
    setFilteredDevices(filtered);
  }, [searchQuery, devices]);

  const getBedNumber = (bedId: number) => {
    return beds.find(b => b.id === bedId)?.bed_number || `Bed ${bedId}`;
  };

  const handleEdit = (device: Device) => {
    setSelectedDevice(device);
    setIsDialogOpen(true);
  };

  const handleDelete = (device: Device) => {
    setSelectedDevice(device);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedDevice(null);
    setIsDialogOpen(true);
  };

  const handleRotateKey = async (device: Device) => {
    try {
      const res = await api.post(`devices/admin/devices/${device.id}/rotate-key/`);
      if (res.data.success) {
        toast.success(`Key rotated for ${device.serial_number}`);
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to update device key");
    }
  };

  const handleRevokeKey = async (device: Device) => {
    if (!confirm(`Are you sure you want to REVOKE ALL CREDENTIALS for ${device.serial_number}? All real-time telemetry from this device will be blocked.`)) return;

    try {
      const res = await api.post(`devices/admin/devices/${device.id}/revoke-key/`);
      if (res.data.success) {
        toast.warning(`Credentials REVOKED for ${device.serial_number}`);
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to revoke credentials");
    }
  };

  const onlineCount = devices.filter(d => d.status === "ACTIVE").length;
  const errorCount = devices.filter(d => d.status === "ERROR").length;
  const simulationCount = devices.filter(d => d.mode === "SIMULATION").length;

    return (
        <div className="p-10 pt-16 space-y-12 min-h-screen bg-zinc-50/30 w-full max-w-[1600px] mx-auto text-left">
            {/* 🛡️ PREMIUM HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex flex-col text-left">
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 leading-none uppercase">
                        Medical <span className="text-[#5C61F2]">Devices</span>
                    </h1>
                </div>

                <Button
                    onClick={handleCreate}
                    className="bg-[#5C61F2] hover:bg-[#4A4ED4] text-white shadow-xl shadow-[#5C61F2]/20 h-16 px-10 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 border-none"
                >
                    Add New Device
                </Button>
            </div>

            {/* 📋 FLEET METRICS */}
            {!loading && devices.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="group relative bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/30 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-100/50 transition-colors" />
                        <div className="relative z-10 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                                <Wifi className="w-6 h-6 text-emerald-600" />
                            </div>
                            <p className="text-4xl font-black text-zinc-900 tracking-tight leading-none mb-2">{onlineCount}</p>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Online Devices</p>
                        </div>
                    </div>

                    <div className="group relative bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-500 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/30 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-rose-100/50 transition-colors" />
                        <div className="relative z-10 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20 group-hover:scale-110 transition-transform duration-500">
                                <ShieldAlert className="w-6 h-6 text-rose-600" />
                            </div>
                            <p className="text-4xl font-black text-rose-600 tracking-tight leading-none mb-2">{errorCount}</p>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Critical Issues</p>
                        </div>
                    </div>

                    <div className="group relative bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-100/50 transition-colors" />
                        <div className="relative z-10 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                                <Activity className="w-6 h-6 text-indigo-600" />
                            </div>
                            <p className="text-4xl font-black text-zinc-900 tracking-tight leading-none mb-2">{simulationCount}</p>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Simulated Devices</p>
                        </div>
                    </div>
                    <div className="group relative bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-500 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/30 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-rose-100/50 transition-colors" />
                        <div className="relative z-10 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20 group-hover:scale-110 transition-transform duration-500">
                                <ShieldAlert className="w-6 h-6 text-rose-600" />
                            </div>
                            <p className="text-4xl font-black text-rose-600 tracking-tight leading-none mb-2">{devices.filter(d => d.status === "ERROR").length}</p>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Offline Devices</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔍 SEARCH BAR */}
            <div className="flex items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                        placeholder="SEARCH BY SERIAL, IP, TYPE, OR LOCATION..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 bg-zinc-50 border-none focus-visible:ring-0 focus:bg-white focus:ring-2 focus:ring-[#5C61F2]/10 h-16 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest text-zinc-900 placeholder:text-zinc-400"
                    />
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchData}
                    className="bg-zinc-50 border border-zinc-100 hover:bg-indigo-50 text-zinc-400 hover:text-indigo-600 h-16 w-16 rounded-2xl transition-all active:scale-95 shadow-sm"
                    title="Refresh"
                >
                    <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                </Button>
            </div>

            {/* 📋 DEVICE REGISTRY TABLE */}
            <div className="bg-white border border-zinc-100 rounded-[3rem] overflow-hidden shadow-sm">
                <DeviceTable
                    devices={filteredDevices}
                    isLoading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRotateKey={handleRotateKey}
                    onRevokeKey={handleRevokeKey}
                />
                
                <div className="p-10 border-t border-zinc-50 bg-zinc-50/20 text-left">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">System Status Active</p>
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-1">All Devices • Total Count: {devices.length}</p>
                </div>
            </div>

            {/* 🛠️ DIALOGS */}
            <DeviceDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                device={selectedDevice}
                onSuccess={fetchData}
                beds={beds}
            />
            <DeviceDeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                device={selectedDevice}
                onSuccess={fetchData}
            />
        </div>
    );
}
