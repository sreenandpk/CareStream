from django.contrib import admin
from apps.vitals.models import Vital


@admin.register(Vital)
class VitalAdmin(admin.ModelAdmin):

    # 🔥 LIST VIEW
    list_display = (
        "id",
        "device",
        "patient",
        "source",
        "heart_rate",
        "spo2",
        "temperature",
        "recorded_at",
    )

    # 🔥 SEARCH
    search_fields = (
        "device__serial_number",
        "patient__name",
    )

    # 🔥 FILTERS
    list_filter = (
        "source",
        "device",
        "patient",
        "recorded_at",
    )

    # 🔥 ORDER
    ordering = ("-recorded_at",)

    # 🔥 PERFORMANCE
    list_select_related = (
        "device",
        "patient",
    )

    # 🔥 READ ONLY (IMPORTANT)
    readonly_fields = (
        "recorded_at",
        "created_at",
        "updated_at",
        "deleted_at",
    )

    # 🔥 FIELD GROUPING
    fieldsets = (
        ("Relations", {
            "fields": (
                "device",
                "patient",
                "source",
            )
        }),

        ("Vitals", {
            "fields": (
                "heart_rate",
                "spo2",
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

    # 🔥 SOFT DELETE FILTER
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(is_deleted=False)

    # 🔥 MAKE READ-ONLY AFTER CREATE
    def has_change_permission(self, request, obj=None):
        if obj:
            return False
        return super().has_change_permission(request, obj)