from django.contrib import admin
from .models import Device
@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = (
        "device_id",
        "bed",
        "device_type",
        "status",
        "last_seen",
    )
    search_fields = ("device_id",)
    list_filter = ("status", "device_type")
    ordering = ("device_id",)