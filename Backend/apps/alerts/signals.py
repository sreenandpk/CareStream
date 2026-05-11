from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from apps.alerts.models import Alert

User = get_user_model()

@receiver(post_save, sender=User)
def cleanup_deactivated_doctor_alerts(sender, instance, **kwargs):
    """
    Automated cleanup: If a Doctor is deactivated, unassign them from any
    active or acknowledged alerts.
    """
    if not instance.is_active and instance.role == "DOCTOR":
        if hasattr(instance, 'alerts'):
            active_alerts = instance.alerts.filter(status__in=["ACTIVE", "ACKNOWLEDGED"])
            if active_alerts.exists():
                active_alerts.update(doctor=None)
                print(f"DEBUG: Unassigned deactivated doctor {instance.username} from active alerts.")
                
@receiver(post_save, sender=User)
def cleanup_deactivated_nurse_alerts(sender, instance, **kwargs):
    """
    Unassign deactivated nurses from alerts if applicable (nurses can also be linked to alerts).
    """
    if not instance.is_active and instance.role == "NURSE":
        # Check if Nurse is linked to alerts (the model might not have a direct nurse field yet, but if it does, clear it)
        if hasattr(instance, 'assigned_alerts'):
            instance.assigned_alerts.all().update(nurse=None)
            print(f"DEBUG: Unassigned deactivated nurse {instance.username} from alerts.")
