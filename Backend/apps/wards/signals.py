from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from apps.wards.models import Ward, NurseShift

User = get_user_model()

@receiver(post_save, sender=User)
def cleanup_deactivated_nurse_wards(sender, instance, **kwargs):
    """
    Automated cleanup: If a user (nurse) is deactivated, remove them from all 
    ward assignments and deactivate their active shifts.
    """
    if not instance.is_active:
        # 1. Remove from all Ward many-to-many assignments
        if hasattr(instance, 'assigned_wards') and instance.assigned_wards.exists():
            instance.assigned_wards.clear()
            print(f"DEBUG: Removed deactivated user {instance.username} from all ward assignments.")

        # 2. Deactivate any active NurseShift records
        if hasattr(instance, 'shifts'):
            active_shifts = instance.shifts.filter(is_active=True)
            if active_shifts.exists():
                active_shifts.update(is_active=False)
                print(f"DEBUG: Deactivated active shifts for user {instance.username}.")
