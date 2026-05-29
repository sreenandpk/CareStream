from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from apps.alerts.models import Alert


def get_doctor_alerts(user):
    if user.username == "demo_doctor":
        # Public Demo: Return all active alerts so the recruiter has a lively telemetry command feed
        return (
            Alert.objects.filter(
                is_active=True,
                is_deleted=False,
            )
            .select_related("patient", "device")
            .only(
                "id",
                "alert_type",
                "message",
                "severity",
                "status",
                "created_at",
                "patient__name",
                "device__serial_number",
            )
            .order_by("-created_at")[:100]
        )
    else:
        return (
            Alert.objects.filter(
                doctor=user,
                is_active=True,
                is_deleted=False,
            )
            .select_related("patient", "device")
            .only(
                "id",
                "alert_type",
                "message",
                "severity",
                "status",
                "created_at",
                "patient__name",
                "device__serial_number",
            )
            .order_by("-created_at")[:100]
        )


def get_doctor_alert_by_id(alert_id, user):
    try:
        alert = (
            Alert.objects
            .select_related("patient", "device")
            .get(id=alert_id, is_deleted=False)
        )
    except Alert.DoesNotExist:
        raise NotFound("Alert not found")

    if user.username != "demo_doctor" and alert.doctor != user:
        raise PermissionDenied("Access denied")

    return alert


def acknowledge_doctor_alert(alert):
    if alert.status != Alert.Status.ACTIVE:
        raise ValidationError("Already processed")

    alert.acknowledge()
    return alert


def resolve_doctor_alert(alert, user):
    if alert.status == Alert.Status.RESOLVED:
        raise ValidationError("Already resolved")

    alert.resolve(user)
    return alert