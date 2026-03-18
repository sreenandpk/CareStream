from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "email",
            "phone",
            "role",
            "is_active",
        ]
        def validate_role(self, value):

            if value == "SYSTEM_ADMIN":
                raise serializers.ValidationError(
                    "Cannot assign SYSTEM_ADMIN"
                )

            return value
        def validate_email(self, value):

            if User.objects.filter(
                email=value
            ).exclude(
                id=self.instance.id
            ).exists():

                raise serializers.ValidationError(
                    "Email already exists"
                )

            return value