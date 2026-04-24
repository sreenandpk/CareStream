"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw, Cpu, Activity, Wifi, ShieldAlert, WifiOff, Zap } from "lucide-react";
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
      toast.error("Failed to sync clinical hardware fleet");
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
      toast.error("Failed to rotate clinical hardware key");
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
      toast.error("Failed to revoke hardware credentials");
    }
  };

  const onlineCount = devices.filter(d => d.status === "ACTIVE").length;
  const errorCount = devices.filter(d => d.status === "ERROR").length;
  const simulationCount = devices.filter(d => d.mode === "SIMULATION").length;

  return (
    <DashboardShell>
      <div className="p-8 space-y-8 min-h-full max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Cpu className="w-6 h-6 text-emerald-500" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-100">
                Device Fleet
              </h1>
            </div>
            <p className="text-zinc-500 mt-2 font-medium italic text-sm">
              Strategic monitoring and configuration of clinical hardware, vital protocols, and heartbeat connectivity.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 px-8 h-12 rounded-xl transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            Register Hardware
          </Button>
        </div>

        {/* Fleet Metrics */}
        {!loading && devices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:opacity-20 transition-opacity">
                <Wifi className="w-20 h-20 text-emerald-500" />
              </div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Links</p>
              <p className="text-4xl font-black mt-2 text-emerald-500">{onlineCount}</p>
              <p className="text-[10px] text-zinc-600 mt-1 uppercase font-bold tracking-tighter">Healthy Heartbeats</p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 backdrop-blur-sm relative overflow-hidden group">
               <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldAlert className="w-20 h-20 text-rose-500" />
              </div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">System Faults</p>
              <p className="text-4xl font-black mt-2 text-rose-500">{errorCount}</p>
              <p className="text-[10px] text-zinc-600 mt-1 uppercase font-bold tracking-tighter">Requires Urgent Service</p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 backdrop-blur-sm relative overflow-hidden group">
               <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity className="w-20 h-20 text-blue-500" />
              </div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Simulation Pulse</p>
              <p className="text-4xl font-black mt-2 text-blue-500">{simulationCount}</p>
              <p className="text-[10px] text-zinc-600 mt-1 uppercase font-bold tracking-tighter">Data Generation Engine</p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 backdrop-blur-sm relative overflow-hidden group">
               <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-20 h-20 text-amber-500" />
              </div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Live Vital Core</p>
              <p className="text-4xl font-black mt-2 text-amber-500">{devices.length - simulationCount}</p>
              <p className="text-[10px] text-zinc-600 mt-1 uppercase font-bold tracking-tighter">Precision Field Hardware</p>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex items-center gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50 backdrop-blur-md">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
            <Input
              placeholder="Search by serial number (SN-...), IP address, device type, or bed location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/40 border-zinc-800 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600 h-11"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="bg-black/40 border-zinc-800 hover:bg-zinc-900 text-zinc-400 h-11 w-11 rounded-xl"
            title="Scan fleet connectivity"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Content Section */}
        <div className="mt-2">
            <DeviceTable
                devices={filteredDevices}
                isLoading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRotateKey={handleRotateKey}
                onRevokeKey={handleRevokeKey}
            />
        </div>

        {/* Dialogs */}
        <DeviceDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          device={selectedDevice}
          onSuccess={fetchData}
        />
        <DeviceDeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          device={selectedDevice}
          onSuccess={fetchData}
        />
      </div>
    </DashboardShell>
  );
}
