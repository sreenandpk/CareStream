from rest_framework.exceptions import NotFound
from django.contrib.auth import get_user_model
User = get_user_model()
def get_all_users():
    return User.objects.filter(is_active=True).order_by("id")
def get_user_by_id(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise NotFound("User not found")