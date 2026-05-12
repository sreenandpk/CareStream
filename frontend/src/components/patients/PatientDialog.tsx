"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/axios";
import { toast } from "sonner";
import { User, Loader2, Hospital, Stethoscope, BriefcaseMedical, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Bed {
  id: number;
  bed_number: string;
  status: string;
}

interface Doctor {
  id: number;
  username: string;
}

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  diagnosis?: string;
  bed: number;
  doctor?: number;
  primary_nurse?: number;
  mode: string;
  is_active: boolean;
}

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
  onSuccess: () => void;
}

export default function PatientDialog({
  open,
  onOpenChange,
  patient,
  onSuccess,
}: PatientDialogProps) {
  const [loading, setLoading] = useState(false);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nurses, setNurses] = useState<Doctor[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    age: 0,
    gender: "MALE",
    diagnosis: "",
    bed: "",
    doctor: "",
    primary_nurse: "",
    mode: "SIMULATION",
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      fetchClinicalDependencies();
      if (patient) {
        setFormData({
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          diagnosis: patient.diagnosis || "",
          bed: patient.bed.toString(),
          doctor: patient.doctor?.toString() || "",
          primary_nurse: patient.primary_nurse?.toString() || "",
          mode: patient.mode,
          is_active: patient.is_active,
        });
      } else {
        setFormData({
          name: "",
          age: 0,
          gender: "MALE",
          diagnosis: "",
          bed: "",
          doctor: "",
          primary_nurse: "",
          mode: "SIMULATION",
          is_active: true,
        });
      }
    }
  }, [open, patient]);

  const fetchClinicalDependencies = async () => {
    try {
      const [bedsRes, doctorsRes, nursesRes] = await Promise.all([
        api.get("beds/admin/beds/"),
        api.get("accounts/users/?role=DOCTOR&active=true"),
        api.get("accounts/users/?role=NURSE&active=true")
      ]);

      if (bedsRes.data.success) {
        const rawBeds = bedsRes.data.data || bedsRes.data.results || [];
        // Only show AVAILABLE beds, OR the current bed if editing
        const availableBeds = rawBeds.filter((b: Bed) => 
            b.status === "AVAILABLE" || (patient && b.id === patient.bed)
        );
        setBeds(availableBeds);
      }
      if (doctorsRes.data.success) {
        const rawDoctors = doctorsRes.data.data || doctorsRes.data.results || [];
        setDoctors(rawDoctors);
      }
      if (nursesRes.data.success) {
        const rawNurses = nursesRes.data.data || nursesRes.data.results || [];
        setNurses(rawNurses);
      }
    } catch (error) {
      toast.error("Failed to sync clinical infrastructure");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        bed: parseInt(formData.bed),
        doctor: formData.doctor ? parseInt(formData.doctor) : null,
        primary_nurse: formData.primary_nurse ? parseInt(formData.primary_nurse) : null,
        age: parseInt(formData.age.toString()),
      };

      if (patient) {
        await api.put(`patients/admin/admin/patients/${patient.id}/`, payload);
        toast.success("Patient records updated");
      } else {
        await api.post("patients/admin/admin/patients/", payload);
        toast.success("Admission successful");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const rawError = error.response?.data?.message || error.response?.data?.error;
      let message = "System error: Failed to process request";

      if (typeof rawError === "string") {
        message = rawError;
      } else if (typeof rawError === "object" && rawError !== null) {
        // If it's a DRF error dict, extract the first error message
        const firstKey = Object.keys(rawError)[0];
        const firstError = rawError[firstKey];
        message = Array.isArray(firstError) ? firstError[0] : JSON.stringify(rawError);
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] !bg-white border-none !text-zinc-800 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-4 bg-[#5C61F2]/5 border-b border-[#5C61F2]/10">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#5C61F2]/10 flex items-center justify-center border border-[#5C61F2]/20">
              <User className="w-6 h-6 text-[#5C61F2]" />
            </div>
            <div className="flex flex-col">
              <DialogTitle className="text-2xl font-black tracking-tight uppercase">
                {patient ? "Edit Patient Details" : "Add New Patient"}
              </DialogTitle>
              <p className="text-[#5C61F2] text-[10px] font-black uppercase tracking-widest mt-0.5">
                Patient Information & Bed Assignment
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-10 pt-6 space-y-6">
          <div className="space-y-6">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-6 space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 ml-1">Full Name</Label>
                <Input
                  placeholder="Full Legal Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="!bg-white border border-zinc-100 h-14 rounded-2xl focus-visible:ring-2 focus-visible:ring-[#5C61F2]/10 font-bold !text-zinc-800 placeholder:text-zinc-300 transition-all"
                  required
                />
              </div>
              <div className="col-span-3 space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 ml-1">Age</Label>
                <Input
                  type="number"
                  min="0"
                  max="150"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  className="!bg-white border border-zinc-100 h-14 rounded-2xl focus-visible:ring-2 focus-visible:ring-[#5C61F2]/10 font-black !text-zinc-800 text-lg transition-all text-center"
                  required
                />
              </div>
              <div className="col-span-3 space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 ml-1">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) => setFormData({ ...formData, gender: val })}
                >
                  <SelectTrigger className="!bg-white border border-zinc-100 h-14 rounded-2xl focus:ring-2 focus:ring-[#5C61F2]/10 font-bold !text-zinc-800 [&>span]:!text-zinc-800 px-6 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-zinc-100 shadow-2xl rounded-2xl p-2">
                    <SelectItem value="MALE" className="rounded-xl font-bold text-zinc-800 focus:bg-[#5C61F2]/10 focus:text-[#5C61F2]">Male</SelectItem>
                    <SelectItem value="FEMALE" className="rounded-xl font-bold text-zinc-800 focus:bg-[#5C61F2]/10 focus:text-[#5C61F2]">Female</SelectItem>
                    <SelectItem value="OTHER" className="rounded-xl font-bold text-zinc-800 focus:bg-[#5C61F2]/10 focus:text-[#5C61F2]">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6 p-6 bg-[#F8F9FB] rounded-[2.5rem] border border-zinc-100">
              <div className="col-span-4 space-y-2 text-left">
                <div className="flex items-center gap-2 mb-1 ml-1">
                  <Hospital className="w-3 h-3 text-[#5C61F2]" />
                  <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Bed Number</Label>
                </div>
                <Select
                  value={formData.bed}
                  onValueChange={(val) => setFormData({ ...formData, bed: val })}
                  required
                >
                  <SelectTrigger className="!bg-white border border-zinc-100 h-12 rounded-xl focus:ring-2 focus:ring-[#5C61F2]/10 font-bold !text-zinc-800 [&>span]:!text-zinc-800 px-4 shadow-sm">
                    <SelectValue placeholder="Select Bed" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-zinc-100 shadow-2xl rounded-2xl p-2">
                    {beds.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-[10px] font-black text-rose-500 uppercase">None Available</p>
                      </div>
                    ) : (
                      beds.map((bed) => (
                        <SelectItem key={bed.id} value={bed.id.toString()} className="rounded-xl font-bold text-zinc-800 focus:bg-[#5C61F2]/10 focus:text-[#5C61F2]">
                          Bed {bed.bed_number}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-4 space-y-2 text-left">
                <div className="flex items-center gap-2 mb-1 ml-1">
                  <Stethoscope className="w-3 h-3 text-[#5C61F2]" />
                  <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Doctor Name</Label>
                </div>
                <Select
                  value={formData.doctor}
                  onValueChange={(val) => setFormData({ ...formData, doctor: val })}
                >
                  <SelectTrigger className="!bg-white border border-zinc-100 h-12 rounded-xl focus:ring-2 focus:ring-[#5C61F2]/10 font-bold !text-zinc-800 [&>span]:!text-zinc-800 px-4 shadow-sm">
                    <SelectValue placeholder="Assign Doctor" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-zinc-100 shadow-2xl rounded-2xl p-2">
                    {doctors.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id.toString()} className="rounded-xl font-bold text-zinc-800 focus:bg-[#5C61F2]/10 focus:text-[#5C61F2]">
                        Dr. {doc.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-4 space-y-2 text-left">
                <div className="flex items-center gap-2 mb-1 ml-1">
                  <Users className="w-3 h-3 text-[#5C61F2]" />
                  <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Nurse Name</Label>
                </div>
                <Select
                  value={formData.primary_nurse}
                  onValueChange={(val) => setFormData({ ...formData, primary_nurse: val })}
                >
                  <SelectTrigger className="!bg-white border border-zinc-100 h-12 rounded-xl focus:ring-2 focus:ring-[#5C61F2]/10 font-bold !text-zinc-800 [&>span]:!text-zinc-800 px-4 shadow-sm">
                    <SelectValue placeholder="Assign Nurse" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-zinc-100 shadow-2xl rounded-2xl p-2">
                    {nurses.map((nurse) => (
                      <SelectItem key={nurse.id} value={nurse.id.toString()} className="rounded-xl font-bold text-zinc-800 focus:bg-[#5C61F2]/10 focus:text-[#5C61F2]">
                         {nurse.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 ml-1">Diagnosis & Notes</Label>
              <Textarea
                placeholder="Primary diagnosis and clinical notes..."
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                className="!bg-white dark:!bg-white border border-zinc-100 rounded-2xl focus-visible:ring-2 focus-visible:ring-[#5C61F2]/10 font-bold !text-zinc-800 dark:!text-zinc-800 min-h-[120px] p-4 transition-all"
              />
            </div>
          </div>

          <DialogFooter className="gap-3 pt-6 border-t border-zinc-50">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest text-zinc-400 hover:text-zinc-800 transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-14 px-10 bg-[#5C61F2] hover:bg-[#4A4ED4] text-white shadow-xl shadow-[#5C61F2]/20 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : patient ? (
                "Save Changes"
              ) : (
                "Add Patient"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
