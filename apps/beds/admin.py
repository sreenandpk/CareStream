from django.contrib import admin
from django import forms
from django.core.exceptions import ValidationError

from .models import Bed


# =========================
# Form with validation
# =========================

class BedAdminForm(forms.ModelForm):

    class Meta:
        model = Bed
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()

        room = cleaned_data.get("room")

        if not room:
            return cleaned_data

        capacity = room.capacity

        existing_beds = room.beds.count()

        # when editing, exclude current instance
        if self.instance.pk:
            existing_beds -= 1

        if existing_beds >= capacity:
            raise ValidationError(
                f"Room capacity exceeded. Max allowed: {capacity}"
            )

        return cleaned_data


# =========================
# Admin
# =========================

@admin.register(Bed)
class BedAdmin(admin.ModelAdmin):

    form = BedAdminForm

    list_display = ("id", "bed_number", "room", "status")

    search_fields = ("bed_number",)

    list_filter = ("status", "room")

    ordering = ("bed_number",)

    readonly_fields = ("created_at", "updated_at")