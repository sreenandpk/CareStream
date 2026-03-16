from django.contrib import admin
from .models import Ward
@admin.register(Ward)
class WardAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "floor", "created_at", "updated_at")
    search_fields = ("name",)
    list_filter = ("floor",)
    ordering = ("floor",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Ward Information", {
            "fields": ("name", "floor", "description")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )