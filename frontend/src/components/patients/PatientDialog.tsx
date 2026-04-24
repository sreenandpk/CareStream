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
import { User, Loader2, Hospital, Stethoscope, BriefcaseMedical } from "lucide-react";

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
  const [formData, setFormData] = useState({
    name: "",
    age: 0,
    gender: "MALE",
    diagnosis: "",
    bed: "",
    doctor: "",
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
          mode: "SIMULATION",
          is_active: true,
        });
      }
    }
  }, [open, patient]);

  const fetchClinicalDependencies = async () => {
    try {
      const [bedsRes, doctorsRes] = await Promise.all([
        api.get("beds/admin/beds/"),
        api.get("accounts/users/?role=DOCTOR&active=true")
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
      let message = "Internal medical fault";

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
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-zinc-100 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Hospital className="w-5 h-5 text-blue-500" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              {patient ? "Modify Admission" : "New Patient Admission"}
            </DialogTitle>
          </div>
          <p className="text-zinc-500 text-xs font-medium italic">
            Configure clinical identity, physiological monitoring mode, and ward assignment.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                        Full Name
                    </Label>
                    <Input
                        placeholder="Legal Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-black/40 border-zinc-800 focus:ring-blue-500/20 text-zinc-200 h-11"
                        required
                    />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                        Age (Years)
                    </Label>
                    <Input
                        type="number"
                        min="0"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                        className="bg-black/40 border-zinc-800 focus:ring-blue-500/20 text-zinc-200 h-11 font-mono font-bold"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                        Gender
                    </Label>
                    <Select
                        value={formData.gender}
                        onValueChange={(val) => setFormData({ ...formData, gender: val })}
                    >
                        <SelectTrigger className="bg-black/40 border-zinc-800 text-zinc-200 h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                        Monitoring Mode
                    </Label>
                    <Select
                        value={formData.mode}
                        onValueChange={(val) => setFormData({ ...formData, mode: val })}
                    >
                        <SelectTrigger className="bg-black/40 border-zinc-800 text-zinc-200 h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                            <SelectItem value="SIMULATION">Simulation</SelectItem>
                            <SelectItem value="REAL">Real Hardware</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                Clinical Diagnosis
              </Label>
              <Textarea
                placeholder="Initial clinical observations..."
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                className="bg-black/40 border-zinc-800 focus:ring-blue-500/20 text-zinc-200 min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 flex items-center gap-1.5">
                        <BriefcaseMedical className="w-2.5 h-2.5" /> Bed Assignment
                    </Label>
                    <Select
                        value={formData.bed}
                        onValueChange={(val) => setFormData({ ...formData, bed: val })}
                        required
                    >
                        <SelectTrigger className="bg-black/40 border-zinc-800 text-zinc-200 h-11 font-mono">
                            <SelectValue placeholder="Select Bed" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                            {beds.map((bed) => (
                                <SelectItem key={bed.id} value={bed.id.toString()}>
                                    Bed {bed.bed_number}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 flex items-center gap-1.5">
                        <Stethoscope className="w-2.5 h-2.5" /> Lead Physician
                    </Label>
                    <Select
                        value={formData.doctor}
                        onValueChange={(val) => setFormData({ ...formData, doctor: val })}
                    >
                        <SelectTrigger className="bg-black/40 border-zinc-800 text-zinc-200 h-11">
                            <SelectValue placeholder="Assign Doctor" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                            {doctors.map((doctor) => (
                                <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                    Dr. {doctor.username}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-xl border border-zinc-800/50 backdrop-blur-md">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-zinc-200">Active Admission</Label>
                <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Deactivating marks the patient as discharged</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-zinc-800/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-transparent border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-lg shadow-blue-600/20"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {patient ? "Update Record" : "Confirm Admission"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
