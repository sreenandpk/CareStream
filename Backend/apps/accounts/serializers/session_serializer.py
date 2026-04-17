from rest_framework import serializers
from apps.accounts.models import UserSession
class SessionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username"
    )
    role = serializers.CharField(
        source="user.role"
    )
    class Meta:
        model = UserSession
        fields = [
            "id",
            "user",
            "username",
            "role",
            "ip_address",
            "user_agent",
            "login_time",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        # Mask sensitive info for non-admins
        if request and request.user and getattr(request.user, 'role', None) != "ADMIN":
            data.pop("ip_address", None)
            data.pop("user_agent", None)
        return data