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
  RefreshCcw
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-zinc-900/50 rounded-xl" />
        ))}
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-950/50 rounded-2xl border border-dashed border-zinc-800">
        <Cpu className="w-12 h-12 text-zinc-700 mb-4" />
        <h3 className="text-xl font-bold text-zinc-300">Fleet Empty</h3>
        <p className="text-zinc-500 text-center mt-2 max-w-sm">
          No medical hardware has been registered. Start by adding an ICU Monitor or Patient Sensor to your ward.
        </p>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "ACTIVE": 
        return { 
          color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: Wifi,
          label: "Connected"
        };
      case "OFFLINE": 
        return { 
          color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
          icon: WifiOff,
          label: "Offline"
        };
      case "MAINTENANCE": 
        return { 
          color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          icon: Activity,
          label: "Service"
        };
      case "ERROR": 
        return { 
          color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          icon: AlertTriangle,
          label: "Crit-Fault"
        };
      default: 
        return { 
          color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
          icon: Zap,
          label: status
        };
    }
  };

  return (
    <TooltipProvider>
    <div className="rounded-2xl border border-zinc-900 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl">
      <Table>
        <TableHeader className="bg-zinc-900/40">
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-12 px-6">Hardware Identifier</TableHead>
            <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-12 px-6">Clinical Location</TableHead>
            <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-12 px-6">Monitored Patient</TableHead>
            <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-12 px-6">Fleet Status</TableHead>
            <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-12 px-6">Security Identity</TableHead>
            <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-12 px-6">Connectivity</TableHead>
            <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-12 px-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => {
            const statusConfig = getStatusConfig(device.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <TableRow 
                key={device.id} 
                className="border-zinc-900 hover:bg-zinc-900/30 transition-all group"
              >
                <TableCell className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-zinc-200 tracking-wider uppercase">{device.serial_number}</span>
                    <span className="text-[9px] text-zinc-500 font-black uppercase tracking-tighter mt-0.5">
                      {device.device_type.replace(/_/g, " ")} | v{device.firmware_version || "1.0.0"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-zinc-400">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase text-zinc-500">{device.ward_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-blue-500" />
                        <span className="font-bold text-xs text-zinc-300">Room {device.room_number} - Bed {device.bed_number}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                    {device.patient_name ? (
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-zinc-800 rounded-lg">
                                <Activity className="w-3 h-3 text-emerald-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-200">{device.patient_name}</span>
                                {device.mode === "SIMULATION" ? (
                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">SIMULATED VITALS</span>
                                ) : (
                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">LIVE MONITORING</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2 py-1 border border-dashed border-zinc-800 rounded-md">
                            NO SUBJECT
                        </span>
                    )}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge variant="outline" className={`font-bold text-[10px] flex items-center gap-1.5 w-fit ${statusConfig.color}`}>
                    <StatusIcon className={`w-3 h-3 ${device.status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
                    {statusConfig.label}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Key className="w-3 h-3 text-amber-500" />
                        <span className="text-xs font-mono text-zinc-300 tracking-widest">{device.masked_key || "****...****"}</span>
                    </div>
                    {device.key_created_at && (
                        <span className="text-[9px] text-zinc-600 font-medium lowercase">
                            Rolled At: {format(new Date(device.key_created_at), "HH:mm:ss 'on' MMM d")}
                        </span>
                    )}
                    {device.is_key_revoked ? (
                        <Badge className="bg-rose-500/20 text-rose-500 border-rose-500/30 text-[8px] font-black uppercase tracking-tighter w-fit py-0">REVOKED</Badge>
                    ) : device.mode === "SIMULATION" ? (
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px] font-black uppercase tracking-tighter w-fit py-0">SIMULATED</Badge>
                    ) : (
                        <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[8px] font-black uppercase tracking-tighter w-fit py-0 flex items-center gap-1">
                          <Zap className="w-2 h-2" /> LIVE WIRE
                        </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-zinc-400 font-mono text-[10px]">
                            {device.ip_address || "0.0.0.0"}
                        </div>
                        {device.last_seen && (
                            <div className="flex items-center gap-1 text-zinc-600 text-[9px] font-medium">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Seen At: {format(new Date(device.last_seen), "HH:mm:ss")}</span>
                            </div>
                        )}
                    </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(device)}
                      className="h-8 w-8 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRotateKey(device)}
                      className="h-8 w-8 text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg"
                      title="Rotate Security Token"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRevokeKey(device)}
                      className="h-8 w-8 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                      title="Emergency Revocation"
                    >
                      <ShieldX className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(device)}
                      className="h-8 w-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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
