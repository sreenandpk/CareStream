from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    """
    Standard Admin permission for managing staff and logs.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "ADMIN"
        )

# Aliases for backward compatibility while refactoring views
IsAdminOrSystemAdmin = IsAdmin
IsSystemAdmin = IsAdmin

class IsDoctor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "DOCTOR"
        )

class IsNurse(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "NURSE"
        )

class IsDoctorOrNurse(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ["DOCTOR", "NURSE"]
        )