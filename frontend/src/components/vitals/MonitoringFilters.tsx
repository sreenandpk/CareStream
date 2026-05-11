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

import { useAuthStore } from "@/store/authStore";

interface MonitoringFiltersProps {
  onFilterChange: (filters: { wardId: string; roomId: string; bedId: string }) => void;
}

export default function MonitoringFilters({ onFilterChange }: MonitoringFiltersProps) {
  const { user } = useAuthStore();
  const [wards, setWards] = useState<{ id: number; name: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: number; room_number: string }[]>([]);
  const [beds, setBeds] = useState<{ id: number; bed_number: string }[]>([]);

  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [selectedBed, setSelectedBed] = useState<string>("all");

  const getRolePath = () => {
    switch (user?.role) {
      case "ADMIN": return "admin";
      case "NURSE": return "nurse";
      case "DOCTOR": return "doctor";
      default: return "admin";
    }
  };

  // 🌍 Initial: Fetch Wards
  useEffect(() => {
    if (!user) return;
    const fetchWards = async () => {
      try {
        const path = getRolePath();
        const res = await api.get(`wards/${path}/wards/`);
        if (res.data.success) {
          setWards(res.data.results || res.data.data || []);
        }
      } catch (e) {
        console.error("Filter Engine: Ward fetch failed", e);
      }
    };
    fetchWards();
  }, [user]);

  // 🏠 Cascading: Fetch Rooms when Ward changes
  useEffect(() => {
    if (selectedWard === "all" || !user) {
      setRooms([]);
      return;
    }
    const fetchRooms = async () => {
      try {
        const path = getRolePath();
        const res = await api.get(`rooms/${path}/rooms/?ward=${selectedWard}`);
        if (res.data.success) {
          setRooms(res.data.results || res.data.data || []);
        }
      } catch (e) {
        console.error("Filter Engine: Room fetch failed", e);
      }
    };
    fetchRooms();
  }, [selectedWard, user]);

  // 🛏️ Cascading: Fetch Beds when Room changes
  useEffect(() => {
    if (selectedRoom === "all" || !user) {
      setBeds([]);
      return;
    }
    const fetchBeds = async () => {
      try {
        const path = getRolePath();
        const res = await api.get(`beds/${path}/beds/?room=${selectedRoom}`);
        if (res.data.success) {
          setBeds(res.data.results || res.data.data || []);
        }
      } catch (e) {
        console.error("Filter Engine: Bed fetch failed", e);
      }
    };
    fetchBeds();
  }, [selectedRoom, user]);

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
    <div className="flex flex-wrap items-center gap-6 p-4 bg-white rounded-[2.5rem] border border-zinc-200/60 shadow-sm">
      {/* Ward Selector */}
      <div className="flex items-center gap-4 bg-zinc-50 px-5 py-2.5 rounded-2xl border border-zinc-100 transition-all hover:border-[#5C67F2]/30 group">
        <MapPin className="w-4 h-4 text-[#5C67F2]" />
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.1em] leading-none mb-1">Unit / Ward</span>
          <Select value={selectedWard} onValueChange={(val) => {
            setSelectedWard(val);
            setSelectedRoom("all");
            setSelectedBed("all");
          }}>
            <SelectTrigger className="w-[140px] border-none bg-transparent h-5 p-0 text-[13px] font-bold text-zinc-900 focus:ring-0">
              <SelectValue placeholder="All Wards" />
            </SelectTrigger>
            <SelectContent className="bg-white border-zinc-100 text-zinc-900 rounded-2xl shadow-xl border-none p-2">
              <SelectItem value="all" className="rounded-xl">Global Overview</SelectItem>
              {wards?.map((w) => (
                <SelectItem key={`filter-ward-${w.id}`} value={w.id.toString()} className="rounded-xl">{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Room Selector */}
      <div className="flex items-center gap-4 bg-zinc-50 px-5 py-2.5 rounded-2xl border border-zinc-100 transition-all hover:border-[#5C67F2]/30 group">
        <Home className="w-4 h-4 text-emerald-500" />
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.1em] leading-none mb-1">Room Number</span>
          <Select 
            value={selectedRoom} 
            onValueChange={(val) => {
              setSelectedRoom(val);
              setSelectedBed("all");
            }}
            disabled={selectedWard === "all"}
          >
            <SelectTrigger className="w-[120px] border-none bg-transparent h-5 p-0 text-[13px] font-bold text-zinc-900 focus:ring-0">
              <SelectValue placeholder="All Rooms" />
            </SelectTrigger>
            <SelectContent className="bg-white border-zinc-100 text-zinc-900 rounded-2xl shadow-xl border-none p-2">
              <SelectItem value="all" className="rounded-xl">All Rooms</SelectItem>
              {rooms?.map((r) => (
                <SelectItem key={`filter-room-${r.id}`} value={r.id.toString()} className="rounded-xl">Room {r.room_number}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bed Selector */}
      <div className="flex items-center gap-4 bg-zinc-50 px-5 py-2.5 rounded-2xl border border-zinc-100 transition-all hover:border-[#5C67F2]/30 group">
        <BedDouble className="w-4 h-4 text-cyan-500" />
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.1em] leading-none mb-1">Patient Bed</span>
          <Select 
            value={selectedBed} 
            onValueChange={setSelectedBed}
            disabled={selectedRoom === "all"}
          >
            <SelectTrigger className="w-[100px] border-none bg-transparent h-5 p-0 text-[13px] font-bold text-zinc-900 focus:ring-0">
              <SelectValue placeholder="All Beds" />
            </SelectTrigger>
            <SelectContent className="bg-white border-zinc-100 text-zinc-900 rounded-2xl shadow-xl border-none p-2">
              <SelectItem value="all" className="rounded-xl">All Beds</SelectItem>
              {beds?.map((b) => (
                <SelectItem key={`filter-bed-${b.id}`} value={b.id.toString()} className="rounded-xl">Bed {b.bed_number}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(selectedWard !== "all" || selectedRoom !== "all" || selectedBed !== "all") && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleReset}
          className="h-12 px-6 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 font-black text-[11px] uppercase tracking-wider gap-2 transition-all border border-rose-100"
        >
          <XCircle className="w-4 h-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
