"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw, User, Users, Activity, Loader2, Filter } from "lucide-react";
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
    <DashboardShell>
      <div className="p-8 space-y-8 min-h-full max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-100">
                Patient Directory
              </h1>
            </div>
            <p className="text-zinc-500 mt-2 font-medium italic text-sm text-balance">
              Administrative management of patient records, physician assignments, and clinical hardware protocols.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 px-8 h-12 rounded-xl transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            Admit Patient
          </Button>
        </div>

        {/* Tactical Metrics */}
        {!loading && patients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-24 h-24 text-zinc-100" />
              </div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Admissions</p>
              <div className="flex items-end gap-2 mt-2">
                <p className="text-4xl font-black text-white">{patients.length}</p>
                <p className="text-zinc-600 text-[10px] font-bold mb-1.5 uppercase">Historical Records</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 backdrop-blur-sm relative overflow-hidden group">
               <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity className="w-24 h-24 text-emerald-500" />
              </div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Currently Admitted</p>
              <p className="text-4xl font-black mt-2 text-emerald-500">{activeCount}</p>
              <p className="text-[10px] text-zinc-600 mt-1 uppercase font-bold tracking-tighter">Active Clinical Monitoring</p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 backdrop-blur-sm relative overflow-hidden group">
               <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:opacity-20 transition-opacity">
                <Loader2 className="w-24 h-24 text-rose-500" />
              </div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Live Hardware Monitoring</p>
              <p className="text-4xl font-black mt-2 text-rose-500">{liveHardwareCount}</p>
              <p className="text-[10px] text-zinc-600 mt-1 uppercase font-bold tracking-tighter">Real-time device synchronization</p>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex items-center gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50 backdrop-blur-md">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="Search patients by name, diagnosis, doctor, or bed identifier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/40 border-zinc-800 focus:border-blue-500/50 transition-all placeholder:text-zinc-600 h-11"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="bg-black/40 border-zinc-800 hover:bg-zinc-900 text-zinc-400 h-11 w-11 rounded-xl"
            title="Refresh clinical data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Content Section */}
        <div className="mt-2">
            <PatientTable
                patients={filteredPatients}
                isLoading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                getDoctorName={getDoctorName}
                getBedNumber={getBedNumber}
            />
        </div>

        {/* Dialogs */}
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
    </DashboardShell>
  );
}
