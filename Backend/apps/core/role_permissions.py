from rest_framework.permissions import BasePermission, SAFE_METHODS

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

class IsReadOnlyOrDemoSafe(BasePermission):
    """
    Blocks all mutating requests (POST, PUT, PATCH, DELETE) for public demo accounts
    (usernames starting with 'demo_'), while allowing standard clinical staff to operate normally.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return True  # Let standard IsAuthenticated handle anonymous requests

        if request.user.username.startswith("demo_"):
            # Exemption: Allow public demo accounts to POST to logout safely
            if request.path == "/api/accounts/logout/" and request.method == "POST":
                return True
            # Enforce read-only for all other requests
            return request.method in SAFE_METHODS

        return True