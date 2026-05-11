"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw, User, Users, Activity, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import PatientTable from "@/components/patients/PatientTable";
import PatientDialog from "@/components/patients/PatientDialog";
import PatientDeleteDialog from "@/components/patients/PatientDeleteDialog";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  diagnosis?: string;
  bed: number;
  doctor?: number;
  mode: "SIMULATION" | "REAL";
  admission_date: string;
  is_active: boolean;
}

interface User {
    id: number;
    username: string;
}

interface Bed {
    id: number;
    bed_number: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [patientsRes, doctorsRes, bedsRes] = await Promise.all([
        api.get("patients/admin/admin/patients/"),
        api.get("accounts/users/?role=DOCTOR"),
        api.get("beds/admin/beds/")
      ]);

      if (patientsRes.data.success) {
        setPatients(patientsRes.data.data || patientsRes.data.results || []);
      }
      if (doctorsRes.data.success) {
        setDoctors(doctorsRes.data.data || doctorsRes.data.results || []);
      }
      if (bedsRes.data.success) {
        setBeds(bedsRes.data.data || bedsRes.data.results || []);
      }
    } catch (error) {
      toast.error("Failed to sync patient directory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = patients.filter((patient) => {
      const doctorName = getDoctorName(patient.doctor).toLowerCase();
      const bedNum = getBedNumber(patient.bed).toLowerCase();
      return (
        patient.name.toLowerCase().includes(query) ||
        patient.diagnosis?.toLowerCase().includes(query) ||
        doctorName.includes(query) ||
        bedNum.includes(query)
      );
    });
    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

  const getDoctorName = (doctorId?: number) => {
    if (!doctorId) return "Unassigned";
    return doctors.find(d => d.id === doctorId)?.username || `Dr. ${doctorId}`;
  };

  const getBedNumber = (bedId: number) => {
    return beds.find(b => b.id === bedId)?.bed_number || `Bed ${bedId}`;
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDialogOpen(true);
  };

  const handleDelete = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedPatient(null);
    setIsDialogOpen(true);
  };

  const activeCount = patients.filter(p => p.is_active).length;
  const liveHardwareCount = patients.filter(p => p.is_active && p.mode === "REAL").length;

    return (
        <div className="p-10 pt-16 space-y-12 min-h-screen bg-zinc-50/30 w-full max-w-[1600px] mx-auto text-left">
            {/* 🛡️ PREMIUM HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex flex-col text-left">
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 leading-none uppercase">
                        Patient <span className="text-[#5C61F2]">List</span>
                    </h1>
                </div>

                <Button
                    onClick={handleCreate}
                    className="bg-[#5C61F2] hover:bg-[#4A4ED4] text-white shadow-xl shadow-[#5C61F2]/20 h-16 px-10 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 border-none"
                >
                    Add New Patient
                </Button>
            </div>

            {/* 📋 TACTICAL METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="group relative bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-100/50 transition-colors" />
                    <div className="relative z-10 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                            <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                        <p className="text-4xl font-black text-zinc-900 tracking-tight leading-none mb-2">{patients.length}</p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Total Patients</p>
                    </div>
                </div>

                <div className="group relative bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/30 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-100/50 transition-colors" />
                    <div className="relative z-10 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                            <Activity className="w-6 h-6 text-emerald-600" />
                        </div>
                        <p className="text-4xl font-black text-zinc-900 tracking-tight leading-none mb-2">{activeCount}</p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Admitted Now</p>
                    </div>
                </div>

                <div className="group relative bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/30 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-100/50 transition-colors" />
                    <div className="relative z-10 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                            <Activity className="w-6 h-6 text-[#5C61F2]" />
                        </div>
                        <p className="text-4xl font-black text-zinc-900 tracking-tight leading-none mb-2">{liveHardwareCount}</p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Active Monitors</p>
                    </div>
                </div>
            </div>

            {/* 🔍 SEARCH BAR */}
            <div className="flex items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                        placeholder="SEARCH BY NAME, DIAGNOSIS, DOCTOR, OR ROOM..."
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
                    title="Refresh List"
                >
                    <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                </Button>
            </div>

            {/* 📋 PATIENT REGISTRY TABLE */}
            <div className="bg-white border border-zinc-100 rounded-[3rem] overflow-hidden shadow-sm">
                <PatientTable
                    patients={filteredPatients}
                    isLoading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    getDoctorName={getDoctorName}
                    getBedNumber={getBedNumber}
                />
                
                <div className="p-10 border-t border-zinc-50 bg-zinc-50/20 text-left">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">System Status Active</p>
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-1">All Patients • Total Count: {patients.length}</p>
                </div>
            </div>

            {/* 🛠️ DIALOGS */}
            <PatientDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                patient={selectedPatient}
                onSuccess={fetchData}
            />
            <PatientDeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                patient={selectedPatient}
                onSuccess={fetchData}
            />
        </div>
    );
}
