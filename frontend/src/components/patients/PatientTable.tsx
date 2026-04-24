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
import { Edit2, Trash2, User, Activity, Calendar, Stethoscope, BriefcaseMedical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

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

interface PatientTableProps {
  patients: Patient[];
  isLoading: boolean;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  getDoctorName: (doctorId?: number) => string;
  getBedNumber: (bedId: number) => string;
}

export default function PatientTable({
  patients,
  isLoading,
  onEdit,
  onDelete,
  getDoctorName,
  getBedNumber,
}: PatientTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-zinc-900/50 rounded-xl" />
        ))}
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-950/50 rounded-2xl border border-dashed border-zinc-800">
        <User className="w-12 h-12 text-zinc-700 mb-4" />
        <h3 className="text-xl font-bold text-zinc-300">No Admissions Registered</h3>
        <p className="text-zinc-500 text-center mt-2 max-w-sm">
          The patient directory is currently empty. Start by admitting a new patient to clinical monitoring.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-900 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl">
      <Table>
        <TableHeader className="bg-zinc-900/40">
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-12 px-6">Patient Identity</TableHead>
            <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-12 px-6">Bed & Location</TableHead>
            <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-12 px-6">Assigned Doctor</TableHead>
            <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-12 px-6">Operational Mode</TableHead>
            <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-12 px-6">Status</TableHead>
            <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-12 px-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow 
              key={patient.id} 
              className="border-zinc-900 hover:bg-zinc-900/30 transition-all group"
            >
              <TableCell className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-bold text-zinc-200">{patient.name}</span>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                    <span>{patient.age}Y</span>
                    <span className="opacity-30">|</span>
                    <span>{patient.gender}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 text-zinc-400">
                <div className="flex items-center gap-2">
                  <BriefcaseMedical className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-mono text-xs font-bold">Bed {getBedNumber(patient.bed)}</span>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Stethoscope className="w-3.5 h-3.5 text-zinc-600" />
                  <span className="text-sm font-medium">{getDoctorName(patient.doctor)}</span>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4">
                {patient.mode === "REAL" ? (
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold text-[10px]">
                    LIVE HARDWARE
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold text-[10px]">
                    SIMULATION
                  </Badge>
                )}
              </TableCell>
              <TableCell className="px-6 py-4">
                <div className="flex flex-col gap-1">
                    {patient.is_active ? (
                    <div className="flex items-center gap-2 text-emerald-500/80">
                        <Activity className="w-3 h-3 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Admitted</span>
                    </div>
                    ) : (
                    <div className="flex items-center gap-2 text-zinc-600">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Discharged</span>
                    </div>
                    )}
                    <span className="text-[8px] text-zinc-600 font-mono">
                        {format(new Date(patient.admission_date), "dd MMM HH:mm")}
                    </span>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(patient)}
                    className="h-8 w-8 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(patient)}
                    className="h-8 w-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
