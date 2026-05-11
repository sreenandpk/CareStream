from django.contrib import admin
from django import forms
from django.core.exceptions import ValidationError

from .models import Patient, ClinicalNote, MedicationOrder, MedicationAdministration
from apps.beds.models import Bed


# =========================
# Form
# =========================

class PatientAdminForm(forms.ModelForm):

    class Meta:
        model = Patient
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # 🔥 Only available beds
        qs = Bed.objects.filter(
            status="AVAILABLE",
            is_deleted=False,
        ).select_related(
            "room",
            "room__ward",
        )

        # 🔥 If editing, allow current bed also
        if self.instance and self.instance.bed_id:
            qs = Bed.objects.filter(
                is_deleted=False
            ).select_related(
                "room",
                "room__ward",
            )

        self.fields["bed"].queryset = qs

    def clean(self):

        cleaned_data = super().clean()

        bed = cleaned_data.get("bed")

        if bed:
            qs = Patient.objects.filter(
                bed=bed,
                is_deleted=False,
            )

            if self.instance.pk:
                qs = qs.exclude(id=self.instance.pk)

            if qs.exists():
                raise ValidationError(
                    "This bed already has a patient"
                )

        return cleaned_data


# =========================
# Admin
# =========================

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):

    form = PatientAdminForm

    # 🔥 LIST VIEW
    list_display = (
        "id",
        "name",
        "age",
        "gender",
        "bed",
        "doctor",   # 🔥 NEW
        "mode",     # 🔥 NEW
        "is_active",
        "admission_date",
    )

    # 🔥 SEARCH
    search_fields = (
        "name",
    )

    # 🔥 FILTERS
    list_filter = (
        "gender",
        "mode",      # 🔥 NEW
        "doctor",    # 🔥 NEW
        "admission_date",
        "bed",
    )

    # 🔥 ORDER
    ordering = ("-admission_date",)

    # 🔥 PERFORMANCE
    list_select_related = (
        "bed",
        "bed__room",
        "bed__room__ward",
        "doctor",   # 🔥 NEW
    )

    # 🔥 READ ONLY
    readonly_fields = (
        "created_at",
        "updated_at",
        "admission_date",
    )

    # 🔥 FORM LAYOUT
    fieldsets = (

        ("Patient Information", {
            "fields": (
                "name",
                "age",
                "gender",
                "diagnosis",
            )
        }),

        ("Assignment", {   # 🔥 UPDATED
            "fields": (
                "bed",
                "doctor",   # 🔥 NOW VISIBLE
                "mode",     # 🔥 NOW VISIBLE
            )
        }),

        ("Hospital Stay", {
            "fields": (
                "admission_date",
                "discharge_date",
                "is_active",
            )
        }),

        ("Timestamps", {
            "fields": (
                "created_at",
                "updated_at",
            )
        }),
    )

    # 🔥 HIDE SOFT DELETED
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(is_deleted=False)

    # 🔥 LOCK AFTER DISCHARGE
    def has_change_permission(self, request, obj=None):
        if obj and obj.discharge_date:
            return False
        return super().has_change_permission(request, obj)


@admin.register(ClinicalNote)
class ClinicalNoteAdmin(admin.ModelAdmin):
    list_display = ("patient", "nurse", "created_at")
    search_fields = ("patient__name", "nurse__username", "content")
    list_filter = ("created_at", "nurse")


@admin.register(MedicationOrder)
class MedicationOrderAdmin(admin.ModelAdmin):
    list_display = ("patient", "medication_name", "dosage", "prescribed_by", "is_active")
    search_fields = ("patient__name", "medication_name", "prescribed_by__username")
    list_filter = ("is_active", "prescribed_by", "created_at")


@admin.register(MedicationAdministration)
class MedicationAdministrationAdmin(admin.ModelAdmin):
    list_display = ("order", "nurse", "administered_at", "status")
    search_fields = ("order__medication_name", "nurse__username")
    list_filter = ("status", "administered_at", "nurse")