from django.contrib import admin
from django import forms
from django.core.exceptions import ValidationError

from .models import Patient
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

        qs = Bed.objects.filter(
            status="AVAILABLE",
            is_deleted=False,
        ).select_related(
            "room",
            "room__ward",
        )

        # ✅ FIX HERE
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

    list_display = (
        "id",
        "name",
        "age",
        "gender",
        "bed",
        "admission_date",
        "discharge_date",
    )

    search_fields = (
        "name",
    )

    list_filter = (
        "gender",
        "admission_date",
        "bed",
    )

    ordering = (
        "-admission_date",
    )

    list_select_related = (
        "bed",
        "bed__room",
        "bed__room__ward",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
        "admission_date",
    )

    fieldsets = (

        ("Patient Information", {
            "fields": (
                "name",
                "age",
                "gender",
                "diagnosis",
            )
        }),

        ("Bed Assignment", {
            "fields": (
                "bed",
            )
        }),

        ("Hospital Stay", {
            "fields": (
                "admission_date",
                "discharge_date",
            )
        }),

        ("Timestamps", {
            "fields": (
                "created_at",
                "updated_at",
            )
        }),
    )

    # hide soft deleted
    def get_queryset(self, request):

        qs = super().get_queryset(request)

        return qs.filter(
            is_deleted=False
        )

    # lock after discharge
    def has_change_permission(
        self,
        request,
        obj=None,
    ):

        if obj and obj.discharge_date:
            return False

        return super().has_change_permission(
            request,
            obj,
        )