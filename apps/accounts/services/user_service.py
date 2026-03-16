# services/user_service.py

from rest_framework.exceptions import NotFound
from django.contrib.auth import get_user_model

User = get_user_model()


def get_user_by_id(user_id):

    user = User.objects.filter(id=user_id).first()

    if not user:
        raise NotFound("User not found")

    return user