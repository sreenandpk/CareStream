from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from apps.patients.models import Patient

User = get_user_model()

@receiver(post_save, sender=User)
def cleanup_deactivated_medical_staff_patients(sender, instance, **kwargs):
    """
    Automated cleanup: If a Doctor or Nurse is deactivated, unassign them from 
    their clinical patient duties.
    """
    if not instance.is_active:
        # 1. Unassign as attending Doctor
        if instance.role == "DOCTOR":
            if hasattr(instance, 'patients') and instance.patients.exists():
                instance.patients.all().update(doctor=None)
                print(f"DEBUG: Unassigned deactivated doctor {instance.username} from all patients.")
        
        # 2. Unassign as Primary Nurse
        if instance.role == "NURSE":
            if hasattr(instance, 'primary_patients') and instance.primary_patients.exists():
                instance.primary_patients.all().update(primary_nurse=None)
                print(f"DEBUG: Unassigned deactivated primary nurse {instance.username} from all patients.")
