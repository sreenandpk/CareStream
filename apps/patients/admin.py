from django.contrib import admin
from .models import Patient
@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "age",
        "gender",
        "bed",
        "admission_date",
        "discharge_date",
    )
    search_fields = ("name",)
    list_filter = ("gender", "admission_date", "bed")
    ordering = ("-admission_date",)
    list_select_related = ("bed",)
    readonly_fields = (
        "created_at",
        "updated_at",
        "admission_date",
    )
    fieldsets = (
        ("Patient Information", {
            "fields": ("name", "age", "gender", "diagnosis")
        }),
        ("Bed Assignment", {
            "fields": ("bed",)
        }),
        ("Hospital Stay", {
            "fields": ("admission_date", "discharge_date")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )
    def has_change_permission(self, request, obj=None):
        if obj and obj.discharge_date:
            return False
        return super().has_change_permission(request, obj)