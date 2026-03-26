from django.contrib import admin
from apps.vitals.models import Vital
@admin.register(Vital)
class VitalAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "device",
        "patient",
        "heart_rate",
        "spo2",
        "temperature",
        "recorded_at",
    )
    search_fields = (
        "device__serial_number",
        "patient__name",
    )
    list_filter = (
        "device",
        "patient",
        "recorded_at",
    )
    ordering = (
        "-recorded_at",
    )
    list_select_related = (
        "device",
        "patient",
    )
    readonly_fields = (
        "recorded_at",
        "created_at",
        "updated_at",
        "deleted_at",
    )
    fieldsets = (
        ("Relations", {
            "fields": (
                "device",
                "patient",
            )
        }),
        ("Vitals", {
            "fields": (
                "heart_rate",
                "spo2",
                "respiratory_rate",
                "temperature",
                "systolic_bp",
                "diastolic_bp",
            )
        }),
        ("Timestamps", {
            "fields": (
                "recorded_at",
                "created_at",
                "updated_at",
                "deleted_at",
            )
        }),
    )
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(
            is_deleted=False
        )