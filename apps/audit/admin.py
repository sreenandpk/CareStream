from django.contrib import admin
from .models import AuditLog
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "action",
        "model_name",
        "object_id",
        "timestamp",
        "ip_address",
    )
    search_fields = (
        "user__username",
        "model_name",
    )
    list_filter = (
        "action",
        "timestamp",
    )
    ordering = ("-timestamp",)
    readonly_fields = [field.name for field in AuditLog._meta.fields]
    def has_add_permission(self, request):
        return False