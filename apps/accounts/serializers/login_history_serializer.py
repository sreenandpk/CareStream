from rest_framework import serializers
from apps.accounts.models import LoginHistory


class LoginHistorySerializer(serializers.ModelSerializer):

    class Meta:
        model = LoginHistory

        fields = (
            "id",
            "username",
            "user",
            "ip_address",
            "user_agent",
            "success",
            "reason",
            "created_at",
        )