from django.contrib import admin
from .models import Vital
@admin.register(Vital)
class VitalAdmin(admin.ModelAdmin):
    list_display = (
        "patient",
        "device",
        "heart_rate",
        "spo2",
        "respiratory_rate",
        "temperature",
        "systolic_bp",
        "diastolic_bp",
        "recorded_at",
    )
    search_fields = (
        "patient__name",
        "device__device_id",
    )
    list_filter = ("recorded_at",)
    date_hierarchy = "recorded_at"
    ordering = ("-recorded_at",)
    list_select_related = ("patient", "device")
    # 🔒 Read-only vitals
    readonly_fields = (
        "patient",
        "device",
        "heart_rate",
        "spo2",
        "respiratory_rate",
        "temperature",
        "systolic_bp",
        "diastolic_bp",
        "recorded_at",
    )
    # ❌ No manual creation
    def has_add_permission(self, request):
        return False
    # ❌ No editing
    def has_change_permission(self, request, obj=None):
        return False
    # ❌ No deletion
    def has_delete_permission(self, request, obj=None):
        return False