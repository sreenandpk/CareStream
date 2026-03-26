from django.contrib import admin
from .models import Device


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):

    list_display = (
        "serial_number",
        "bed",
        "device_type",
        "status",
        "last_seen",
        "is_active",
    )

    search_fields = (
        "serial_number",
    )

    list_filter = (
        "status",
        "device_type",
        "is_active",
    )

    ordering = (
        "serial_number",
    )

    list_select_related = (
        "bed",
        "bed__room",
        "bed__room__ward",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
        "deleted_at",
    )

    fieldsets = (
        ("Device Info", {
            "fields": (
                "serial_number",
                "device_type",
                "status",
                "bed",
            )
        }),

        ("Network / Firmware", {
            "fields": (
                "firmware_version",
                "ip_address",
                "last_seen",
            )
        }),

        ("State", {
            "fields": (
                "is_active",
            )
        }),

        ("Audit", {
            "fields": (
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