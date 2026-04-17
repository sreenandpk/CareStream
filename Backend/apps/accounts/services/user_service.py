from rest_framework.exceptions import NotFound
from django.contrib.auth import get_user_model

User = get_user_model()


from django.db.models import Q

def get_all_users_unified(role=None, is_active=None, is_locked=None, search=None):
    queryset = User.objects.all()
    
    # CRITICAL: Unified filtering logic
    print(f"CRITICAL_DEBUG: get_all_users_unified -> active={is_active}, locked={is_locked}, search={search}")

    if is_active is not None:
        queryset = queryset.filter(is_active=is_active)

    if is_locked is not None:
        queryset = queryset.filter(is_locked=is_locked)

    if role:
        queryset = queryset.filter(role=role)

    if search:
        queryset = queryset.filter(
            username__icontains=search
        )

    return queryset.order_by("id")


def get_user_by_id(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise NotFound("User not found")