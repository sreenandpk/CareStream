from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.accounts.serializers.user_serializers import CreateUserSerializer
from apps.core.permissions import IsAdminOrSystemAdmin
from apps.accounts.services.email_service import send_user_credentials


class CreateUserView(APIView):

    permission_classes = [IsAdminOrSystemAdmin]

    def post(self, request):

        serializer = CreateUserSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        # send email safely
        if user.email:
            try:
                send_user_credentials(
                    email=user.email,
                    username=user.username,
                    password=user.raw_password,
                )
            except Exception as e:
                print("Email error:", e)

        return Response(
            {
                "success": True,
                "message": "User created successfully",
                "data": {
                    "username": user.username,
                    "role": user.role,
                },
            },
            status=status.HTTP_201_CREATED,
        )