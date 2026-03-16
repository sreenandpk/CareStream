from django.contrib import admin
from .models import Bed
@admin.register(Bed)
class BedAdmin(admin.ModelAdmin):
    list_display = ("id", "bed_number", "room", "status")
    search_fields = ("bed_number",)
    list_filter = ("status", "room")
    ordering = ("bed_number",)
    readonly_fields = ("created_at", "updated_at")