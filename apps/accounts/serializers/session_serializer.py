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
            "username",
            "role",
            "ip_address",
            "user_agent",
            "login_time",
        ]