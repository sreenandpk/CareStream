from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User, OTP


# ---------- USER ADMIN ----------

@admin.register(User)
class CustomUserAdmin(UserAdmin):

    model = User

    list_display = (
        "id",
        "username",
        "email",
        "role",
        "is_active",
        "is_verified",
        "is_staff",
    )

    list_filter = (
        "role",
        "is_active",
        "is_staff",
        "is_superuser",
    )

    fieldsets = UserAdmin.fieldsets + (
        (
            "Extra Fields",
            {
                "fields": (
                    "role",
                    "phone",
                    "is_verified",
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )


# ---------- OTP ADMIN ----------

@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "code",
        "is_used",
        "created_at",
        "expires_at",
    )

    list_filter = (
        "is_used",
        "created_at",
    )

    search_fields = (
        "user__username",
        "code",
    )

    readonly_fields = (
        "user",
        "code",
        "is_used",
        "created_at",
        "expires_at",
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser