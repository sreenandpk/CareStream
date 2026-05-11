from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from apps.alerts.models import Alert
from apps.wards.models import NurseShift


def get_nurse_alerts(user):
    now = timezone.now()
    # 🔥 Phase 1: Check for active duty shift
    active_wards = list(NurseShift.objects.filter(
        nurse=user,
        is_active=True,
        start_time__lte=now,
        end_time__gte=now
    ).values_list('ward_id', flat=True))

    # 🔥 Phase 2: Standby Fallback
    # If no active shift, allow observational oversight of assigned wards
    if not active_wards:
        from apps.wards.models import Ward
        active_wards = list(Ward.objects.filter(nurses=user).values_list('id', flat=True))

    return (
        Alert.objects.filter(
            patient__bed__room__ward_id__in=active_wards,
            is_active=True,
            is_deleted=False,
        )
        .select_related("patient", "device")
        .distinct()
        .order_by("-created_at")[:100]
    )


def get_nurse_alert_by_id(alert_id, user):
    print(f"🔍 [ID_LOOKUP] Alert: {alert_id} | User: {user.username}")
    try:
        alert = (
            Alert.objects
            .select_related("patient", "device")
            .get(id=alert_id, is_deleted=False)
        )
    except Alert.DoesNotExist:
        raise NotFound("Alert not found")

    # Check if the nurse is currently active for the ward where the patient is located
    now = timezone.now()
    try:
        ward_id = alert.patient.bed.room.ward_id
    except AttributeError:
        # Fallback if patient or bed is missing
        raise PermissionDenied("Access denied: Invalid patient location.")
    
    # 🔥 CLINICAL OVERRIDE: Check for active duty shift or assigned ward fallback
    shift_exists = NurseShift.objects.filter(
        nurse=user,
        ward_id=ward_id,
        is_active=True,
        start_time__lte=now,
        end_time__gte=now
    ).exists()

    if not shift_exists:
        from apps.wards.models import Ward
        if not Ward.objects.filter(id=ward_id, nurses=user).exists():
            raise PermissionDenied(f"Access denied: [Sentinel] Observational fallback check failed for ward {ward_id}")

    return alert


def resolve_nurse_alert(alert, user):
    if alert.status == Alert.Status.RESOLVED:
        raise ValidationError("Already resolved")

    alert.resolve(user)
    return alert