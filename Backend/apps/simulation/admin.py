from django.contrib import admin
from apps.simulation.models import SimulationConfig


@admin.register(SimulationConfig)
class SimulationConfigAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "mode",
        "trend",
        "heart_rate_min",
        "heart_rate_max",
        "spo2_min",
        "spo2_max",
        "is_active",
        "created_at",
    )

    list_filter = (
        "mode",
        "trend",
        "is_active",
    )

    search_fields = (
        "mode",
        "trend",
    )

    ordering = ("-created_at",)

    readonly_fields = (
        "created_at",
        "updated_at",
        "deleted_at",
    )

    fieldsets = (
        ("Simulation Mode", {
            "fields": ("mode", "trend")
        }),

        ("Heart Rate", {
            "fields": ("heart_rate_min", "heart_rate_max")
        }),

        ("SpO2", {
            "fields": ("spo2_min", "spo2_max")
        }),

        ("Blood Pressure", {
            "fields": (
                "systolic_bp_min",
                "systolic_bp_max",
                "diastolic_bp_min",
                "diastolic_bp_max",
            )
        }),


        ("Temperature", {
            "fields": ("temperature_min", "temperature_max")
        }),

        ("Control", {
            "fields": ("device", "variability", "auto_reset", "reset_interval", "is_active")
        }),

        ("Timestamps", {
            "fields": (
                "created_at",
                "updated_at",
                "deleted_at",
            )
        }),
    )