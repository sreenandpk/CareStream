from django.contrib import admin
from apps.alerts.models import Alert


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):

    # 🔥 LIST VIEW
    list_display = (
        "id",
        "patient",
        "device",
        "alert_type",
        "severity",
        "status",
        "doctor",
        "created_at",
        "is_active",
    )

    # 🔍 SEARCH
    search_fields = (
        "patient__name",
        "device__serial_number",
        "alert_type",
        "message",
        "doctor__username",
    )

    # 🎯 FILTERS
    list_filter = (
        "severity",
        "status",
        "is_active",
        "created_at",
        "device",
        "patient",
    )

    # ⚡ PERFORMANCE
    list_select_related = (
        "device",
        "patient",
        "doctor",
        "vital",
    )

    # 📊 ORDERING
    ordering = ("-created_at",)

    # 🔒 READ-ONLY FIELDS
    readonly_fields = (
        "created_at",
        "updated_at",
        "deleted_at",
        "acknowledged_at",
        "resolved_at",
    )

    # 🧩 FIELD GROUPING
    fieldsets = (

        ("Alert Info", {
            "fields": (
                "alert_type",
                "message",
                "severity",
                "status",
                "is_active",
            )
        }),

        ("Relations", {
            "fields": (
                "patient",
                "device",
                "vital",
                "doctor",
            )
        }),

        ("Timestamps", {
            "fields": (
                "acknowledged_at",
                "resolved_at",
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

    # 🔒 PREVENT EDIT AFTER RESOLVE
    def has_change_permission(self, request, obj=None):
        if obj and obj.status == Alert.Status.RESOLVED:
            return False
        return super().has_change_permission(request, obj)

    # 🔥 QUICK ACTIONS (VERY USEFUL)
    actions = ["mark_as_acknowledged", "mark_as_resolved"]

    def mark_as_acknowledged(self, request, queryset):
        for alert in queryset:
            alert.acknowledge()
        self.message_user(request, "Selected alerts acknowledged")

    mark_as_acknowledged.short_description = "Mark selected as Acknowledged"

    def mark_as_resolved(self, request, queryset):
        for alert in queryset:
            alert.resolve()
        self.message_user(request, "Selected alerts resolved")

    mark_as_resolved.short_description = "Mark selected as Resolved"