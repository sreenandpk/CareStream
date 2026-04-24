"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Home, BedDouble, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonitoringFiltersProps {
  onFilterChange: (filters: { wardId: string; roomId: string; bedId: string }) => void;
}

export default function MonitoringFilters({ onFilterChange }: MonitoringFiltersProps) {
  const [wards, setWards] = useState<{ id: number; name: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: number; room_number: string }[]>([]);
  const [beds, setBeds] = useState<{ id: number; bed_number: string }[]>([]);

  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [selectedBed, setSelectedBed] = useState<string>("all");

  // 🌍 Initial: Fetch Wards
  useEffect(() => {
    const fetchWards = async () => {
      try {
        const res = await api.get("wards/admin/wards/");
        if (res.data.success) {
          setWards(res.data.results || res.data.data || []);
        }
      } catch (e) {
        console.error("Filter Engine: Ward fetch failed", e);
      }
    };
    fetchWards();
  }, []);

  // 🏠 Cascading: Fetch Rooms when Ward changes
  useEffect(() => {
    if (selectedWard === "all") {
      setRooms([]);
      return;
    }
    const fetchRooms = async () => {
      try {
        const res = await api.get(`rooms/admin/rooms/?ward=${selectedWard}`);
        if (res.data.success) {
          setRooms(res.data.results || res.data.data || []);
        }
      } catch (e) {
        console.error("Filter Engine: Room fetch failed", e);
      }
    };
    fetchRooms();
  }, [selectedWard]);

  // 🛏️ Cascading: Fetch Beds when Room changes
  useEffect(() => {
    if (selectedRoom === "all") {
      setBeds([]);
      return;
    }
    const fetchBeds = async () => {
      try {
        const res = await api.get(`beds/admin/beds/?room=${selectedRoom}`);
        if (res.data.success) {
          setBeds(res.data.results || res.data.data || []);
        }
      } catch (e) {
        console.error("Filter Engine: Bed fetch failed", e);
      }
    };
    fetchBeds();
  }, [selectedRoom]);

  // 🚀 Dispatch Changes
  useEffect(() => {
    onFilterChange({
      wardId: selectedWard,
      roomId: selectedRoom,
      bedId: selectedBed,
    });
  }, [selectedWard, selectedRoom, selectedBed, onFilterChange]);

  const handleReset = () => {
    setSelectedWard("all");
    setSelectedRoom("all");
    setSelectedBed("all");
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-zinc-900/40 rounded-[2rem] border border-zinc-800/50 backdrop-blur-md">
      {/* Ward Selector */}
      <div className="flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-2xl border border-white/5">
        <MapPin className="w-3 h-3 text-emerald-500" />
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Ward</span>
        <Select value={selectedWard} onValueChange={(val) => {
          setSelectedWard(val);
          setSelectedRoom("all");
          setSelectedBed("all");
        }}>
          <SelectTrigger className="w-[140px] border-none bg-transparent h-8 text-xs font-bold text-zinc-200 focus:ring-0">
            <SelectValue placeholder="All Wards" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-300">
            <SelectItem value="all">Global View</SelectItem>
            {wards?.map((w) => (
              <SelectItem key={`filter-ward-${w.id}`} value={w.id.toString()}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Room Selector */}
      <div className="flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-2xl border border-white/5">
        <Home className="w-3 h-3 text-blue-500" />
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Room</span>
        <Select 
          value={selectedRoom} 
          onValueChange={(val) => {
            setSelectedRoom(val);
            setSelectedBed("all");
          }}
          disabled={selectedWard === "all"}
        >
          <SelectTrigger className="w-[120px] border-none bg-transparent h-8 text-xs font-bold text-zinc-200 focus:ring-0">
            <SelectValue placeholder="All Rooms" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-300">
            <SelectItem value="all">All Rooms</SelectItem>
            {rooms?.map((r) => (
              <SelectItem key={`filter-room-${r.id}`} value={r.id.toString()}>Room {r.room_number}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bed Selector */}
      <div className="flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-2xl border border-white/5">
        <BedDouble className="w-3 h-3 text-cyan-500" />
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Bed</span>
        <Select 
          value={selectedBed} 
          onValueChange={setSelectedBed}
          disabled={selectedRoom === "all"}
        >
          <SelectTrigger className="w-[100px] border-none bg-transparent h-8 text-xs font-bold text-zinc-200 focus:ring-0">
            <SelectValue placeholder="All Beds" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-300">
            <SelectItem value="all">All Beds</SelectItem>
            {beds?.map((b) => (
              <SelectItem key={`filter-bed-${b.id}`} value={b.id.toString()}>Bed {b.bed_number}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(selectedWard !== "all" || selectedRoom !== "all" || selectedBed !== "all") && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleReset}
          className="h-9 px-4 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-400 font-bold text-[10px] uppercase gap-2"
        >
          <XCircle className="w-3 h-3" />
          Reset Filters
        </Button>
      )}
    </div>
  );
}
