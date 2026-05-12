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
import { cn } from "@/lib/utils";
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
          <Skeleton key={i} className="h-24 w-full border border-[#5C67F2]/5 bg-[#5C67F2]/[0.02] rounded-[1.5rem]" />
        ))}
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[2.5rem] border border-dashed border-zinc-200">
        <div className="w-20 h-20 rounded-3xl bg-zinc-50 flex items-center justify-center mb-6">
            <User className="w-10 h-10 text-zinc-300" />
        </div>
        <h3 className="text-2xl font-black text-zinc-900 tracking-tight">No Patients Found</h3>
        <p className="text-zinc-500 text-center mt-3 max-w-sm font-medium">
          No patients found. Add a new patient to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto text-left">
      <Table>
        <TableHeader className="bg-zinc-50/50">
          <TableRow className="border-zinc-100 hover:bg-transparent">
            <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Patient Name</TableHead>
            <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Room & Bed</TableHead>
            <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Doctor</TableHead>
            <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10 text-center">Status</TableHead>
            <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow 
              key={patient.id} 
              className="border-zinc-50 hover:bg-zinc-50/40 transition-all group"
            >
              <TableCell className="px-10 py-8">
                <div className="flex items-center gap-5 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-[#5C61F2]/5 flex items-center justify-center border border-[#5C61F2]/10">
                    <User className="w-6 h-6 text-[#5C61F2]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-zinc-900 uppercase tracking-tight text-sm leading-none">{patient.name}</span>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-2 opacity-60">
                      {patient.gender} • {patient.age}Y • ID: {String(patient.id || 0).padStart(4, '0')}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-10 py-8">
                <div className="flex flex-col gap-2 text-left">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-zinc-50 text-zinc-600 border-none text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">Bed {getBedNumber(patient.bed)}</Badge>
                  </div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Adm: {format(new Date(patient.admission_date), "MMM dd, yyyy")}</span>
                </div>
              </TableCell>
              <TableCell className="px-10 py-8">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100">
                    <Stethoscope className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-zinc-600 uppercase tracking-widest">Dr. {getDoctorName(patient.doctor)}</span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{patient.diagnosis || "General Admission"}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-10 py-8 text-center">
                <div className="flex flex-col items-center gap-2 mx-auto">
                  <Badge className={cn(
                    "border-none text-[8px] font-black uppercase tracking-widest px-4 py-1 rounded-lg shadow-sm w-fit",
                    patient.is_active ? "bg-[#5C61F2]/10 text-[#5C61F2]" : "bg-rose-50 text-rose-600"
                  )}>
                    {patient.is_active ? "Active" : "Discharged"}
                  </Badge>
                  {patient.mode === "SIMULATION" && (
                    <span className="text-[8px] font-black text-[#5C61F2] uppercase tracking-[0.2em] flex items-center gap-1">
                      <Activity className="w-2.5 h-2.5" /> Simulated
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-10 py-8 text-right">
                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(patient)}
                    className="h-11 w-11 text-zinc-400 hover:text-[#5C61F2] hover:bg-[#5C61F2]/5 rounded-2xl transition-all border border-transparent hover:border-[#5C61F2]/10 shadow-sm"
                    title="Edit"
                  >
                    <Edit2 className="h-4.5 w-4.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(patient)}
                    className="h-11 w-11 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100/50 shadow-sm"
                    title="Delete"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
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
