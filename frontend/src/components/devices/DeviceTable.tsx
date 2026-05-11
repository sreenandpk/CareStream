"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit2, 
  Trash2, 
  Cpu, 
  Activity, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  Zap, 
  Monitor,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Key,
  ShieldX,
  RefreshCcw,
  Container
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip";

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

interface DeviceTableProps {
  devices: Device[];
  isLoading: boolean;
  onEdit: (device: Device) => void;
  onDelete: (device: Device) => void;
  onRotateKey: (device: Device) => void;
  onRevokeKey: (device: Device) => void;
}

export default function DeviceTable({
  devices,
  isLoading,
  onEdit,
  onDelete,
  onRotateKey,
  onRevokeKey,
}: DeviceTableProps) {
  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full border border-[#5C67F2]/10 rounded-[1.5rem]" />
        ))}
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white">
        <div className="w-20 h-20 rounded-3xl bg-zinc-50 flex items-center justify-center mb-6">
            <Cpu className="w-10 h-10 text-zinc-200" />
        </div>
        <h3 className="text-2xl font-black text-zinc-900 tracking-tight">No Devices Found</h3>
        <p className="text-zinc-500 text-center mt-3 max-w-sm font-medium">
          Register a monitor or sensor to start tracking vitals in your wards.
        </p>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "ACTIVE": 
        return { 
          color: "bg-emerald-50 text-emerald-500 border-emerald-100",
          icon: Wifi,
          label: "Connected"
        };
      case "OFFLINE": 
        return { 
          color: "bg-zinc-50 text-zinc-400 border-zinc-100",
          icon: WifiOff,
          label: "Offline"
        };
      case "MAINTENANCE": 
        return { 
          color: "bg-amber-50 text-amber-500 border-amber-100",
          icon: Activity,
          label: "Service"
        };
      case "ERROR": 
        return { 
          color: "bg-rose-50 text-rose-500 border-rose-100",
          icon: AlertTriangle,
          label: "System Error"
        };
      default: 
        return { 
          color: "bg-zinc-50 text-zinc-400 border-zinc-100",
          icon: Zap,
          label: status
        };
    }
  };

  const getModeConfig = (mode: string) => {
    switch (mode) {
        case "REAL":
            return { color: "bg-emerald-50 text-emerald-600", icon: Monitor };
        case "SIMULATION":
            return { color: "bg-indigo-50 text-indigo-600", icon: Container };
        default:
            return { color: "bg-zinc-50 text-zinc-600", icon: Cpu };
    }
  };

    return (
        <TooltipProvider>
            <div className="overflow-x-auto text-left">
            <Table>
                <TableHeader className="bg-zinc-50/50">
                    <TableRow className="border-zinc-100 hover:bg-transparent">
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Device Name</TableHead>
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Location</TableHead>
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10 text-center">Mode</TableHead>
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10 text-center">Status</TableHead>
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Device Key</TableHead>
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {devices.map((device) => {
                        const statusConfig = getStatusConfig(device.status);
                        const StatusIcon = statusConfig.icon;
                        const modeConfig = getModeConfig(device.mode);
                        const ModeIcon = modeConfig.icon;

                        return (
                            <TableRow 
                                key={device.id} 
                                className="border-zinc-50 hover:bg-zinc-50/40 transition-all group"
                            >
                                <TableCell className="px-10 py-8">
                                    <div className="flex items-center gap-5 text-left">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
                                            <Cpu className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="font-black text-zinc-900 uppercase tracking-tight text-sm leading-none">{device.serial_number}</span>
                                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1.5">{device.label || "Standard Device"}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                    <TableCell className="px-10 py-8">
                                        <div className="flex flex-col gap-1.5 text-left">
                                            <span className="text-[9px] font-black uppercase text-zinc-300 tracking-widest leading-none">{device.ward_name}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-600/20" />
                                                <span className="font-bold text-xs text-zinc-700 leading-none">Room {device.room_number} — Bed {device.bed_number}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-10 py-8">
                                        {device.patient_name ? (
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
                                                    <Activity className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-zinc-900 leading-none">{device.patient_name}</span>
                                                    {device.mode === "SIMULATION" ? (
                                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1.5">Simulated Device</span>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1.5">Live Monitor</span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-left">
                                                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em] px-4 py-2 border border-dashed border-zinc-100 rounded-xl inline-block">
                                                    Unassigned
                                                </span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-10 py-8">
                                        <Badge variant="outline" className={cn(
                                            "font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-xl flex items-center gap-2 w-fit border-none shadow-sm",
                                            statusConfig.color
                                        )}>
                                            <StatusIcon className={cn("w-3.5 h-3.5", device.status === 'ACTIVE' ? 'animate-pulse' : '')} />
                                            {statusConfig.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-10 py-8">
                                        <div className="flex flex-col gap-2.5 text-left">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100/50">
                                                   <Key className="w-3.5 h-3.5 text-amber-500" />
                                                </div>
                                                <span className="text-[10px] font-black text-zinc-500 tracking-widest break-all max-w-[150px] leading-none uppercase">{device.api_key || device.masked_key || "****...****"}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {device.is_key_revoked ? (
                                                    <Badge className="bg-rose-50 text-rose-600 border-none text-[8px] font-black uppercase tracking-widest w-fit py-0.5 px-2 rounded-lg shadow-sm">Key Revoked</Badge>
                                                ) : device.mode === "SIMULATION" ? (
                                                    <Badge className="bg-indigo-50 text-indigo-600 border-none text-[8px] font-black uppercase tracking-widest w-fit py-0.5 px-2 rounded-lg shadow-sm">Simulated</Badge>
                                                ) : (
                                                    <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase tracking-widest w-fit py-0.5 px-2 rounded-lg shadow-sm flex items-center gap-1.5">
                                                      <Zap className="w-2.5 h-2.5" /> Device Verified
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-10 py-8 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onEdit(device)}
                                                        className="h-11 w-11 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100/50"
                                                    >
                                                        <Edit2 className="w-4.5 h-4.5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-indigo-600 text-white border-none rounded-xl text-[10px] font-black uppercase tracking-widest px-4 py-2">Edit Device</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onRotateKey(device)}
                                                        className="h-11 w-11 text-zinc-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all border border-transparent hover:border-amber-100/50"
                                                    >
                                                        <RefreshCcw className="w-4.5 h-4.5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-amber-500 text-white border-none rounded-xl text-[10px] font-black uppercase tracking-widest px-4 py-2">Refresh Key</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onRevokeKey(device)}
                                                        className="h-11 w-11 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100/50"
                                                    >
                                                        <ShieldX className="w-4.5 h-4.5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-rose-600 text-white border-none rounded-xl text-[10px] font-black uppercase tracking-widest px-4 py-2">Revoke Key</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onDelete(device)}
                                                        className="h-11 w-11 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100/50"
                                                    >
                                                        <Trash2 className="w-4.5 h-4.5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-zinc-900 text-white border-none rounded-xl text-[10px] font-black uppercase tracking-widest px-4 py-2">Delete Device</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </TooltipProvider>
    );
}
