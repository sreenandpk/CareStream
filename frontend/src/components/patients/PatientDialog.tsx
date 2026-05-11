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
      <DialogContent className="sm:max-w-[650px] bg-white border-none text-zinc-900 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-4 bg-emerald-50/50 border-b border-emerald-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <User className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle className="text-2xl font-black tracking-tight">
                {patient ? "Identity Calibration" : "New Patient Admission"}
              </DialogTitle>
              <p className="text-emerald-600 text-[11px] font-black uppercase tracking-widest mt-0.5">
                Clinical Health Record & Assignment
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-8">
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-6">
              <div className="col-span-3 space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Legal Patient Name</Label>
                <Input
                  placeholder="Full Legal Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-zinc-50 border-none h-14 rounded-2xl focus-visible:ring-2 focus-visible:ring-emerald-500/10 font-bold text-zinc-900 placeholder:text-zinc-300 transition-all"
                  required
                />
              </div>
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Age (Years)</Label>
                <Input
                  type="number"
                  min="0"
                  max="150"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  className="bg-zinc-50 border-none h-14 rounded-2xl focus-visible:ring-2 focus-visible:ring-emerald-500/10 font-black text-zinc-900 text-lg transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Biological Sex</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) => setFormData({ ...formData, gender: val })}
                >
                  <SelectTrigger className="bg-zinc-50 border-none h-14 rounded-2xl focus:ring-2 focus:ring-emerald-500/10 font-bold text-zinc-900 px-6 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2">
                    <SelectItem value="MALE" className="rounded-xl font-bold">Male Identification</SelectItem>
                    <SelectItem value="FEMALE" className="rounded-xl font-bold">Female Identification</SelectItem>
                    <SelectItem value="OTHER" className="rounded-xl font-bold">Non-Binary / Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Assigned Care Unit (Bed)</Label>
                <Select
                  value={formData.bed}
                  onValueChange={(val) => setFormData({ ...formData, bed: val })}
                  required
                >
                  <SelectTrigger className="bg-zinc-50 border-none h-14 rounded-2xl focus:ring-2 focus:ring-emerald-500/10 font-bold text-zinc-900 px-6 transition-all">
                    <SelectValue placeholder="Locate available bed" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2">
                    {beds.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-[10px] font-black text-rose-500 uppercase">No Available Beds</p>
                      </div>
                    ) : (
                      beds.map((bed) => (
                        <SelectItem key={bed.id} value={bed.id.toString()} className="rounded-xl font-bold">
                          Bed {bed.bed_number}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Clinical Admission Diagnosis</Label>
              <Textarea
                placeholder="Primary diagnosis and clinical notes..."
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                className="bg-zinc-50 border-none rounded-[2rem] focus-visible:ring-2 focus-visible:ring-emerald-500/10 font-bold text-zinc-900 min-h-[100px] p-6 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-6 p-6 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 mb-1 ml-1">
                  <Stethoscope className="w-3 h-3 text-emerald-600" />
                  <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Attending Physician</Label>
                </div>
                <Select
                  value={formData.doctor}
                  onValueChange={(val) => setFormData({ ...formData, doctor: val })}
                >
                  <SelectTrigger className="bg-white border-none h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/10 font-bold text-zinc-900 px-4 shadow-sm">
                    <SelectValue placeholder="Assign Doctor" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2">
                    {doctors.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id.toString()} className="rounded-xl font-bold">
                        Dr. {doc.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 mb-1 ml-1">
                  <Users className="w-3 h-3 text-emerald-600" />
                  <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Primary Nursing Staff</Label>
                </div>
                <Select
                  value={formData.primary_nurse}
                  onValueChange={(val) => setFormData({ ...formData, primary_nurse: val })}
                >
                  <SelectTrigger className="bg-white border-none h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/10 font-bold text-zinc-900 px-4 shadow-sm">
                    <SelectValue placeholder="Assign Nurse" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2">
                    {nurses.map((nurse) => (
                      <SelectItem key={nurse.id} value={nurse.id.toString()} className="rounded-xl font-bold">
                         {nurse.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-zinc-50/50 rounded-[2.5rem] border border-dashed border-zinc-200">
              <div className="space-y-1 text-left">
                <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Active Clinical State</p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest opacity-60">Enable real-time physiological telemetry.</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                className="data-[state=checked]:bg-emerald-600 scale-110"
              />
            </div>
          </div>

          <DialogFooter className="gap-3 pt-6 border-t border-zinc-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all"
            >
              Discard
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : patient ? (
                "Authorize Updates"
              ) : (
                "Deploy Admission"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
