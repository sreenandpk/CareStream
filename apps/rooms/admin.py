from django.contrib import admin
from .models import Room
@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("id", "room_number", "ward", "room_type", "capacity")
    search_fields = ("room_number",)
    list_filter = ("ward", "room_type")
    ordering = ("room_number",)
    readonly_fields = ("created_at", "updated_at")