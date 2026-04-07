from rest_framework.exceptions import NotFound, PermissionDenied
from apps.alerts.models import Alert


def get_nurse_alerts(user):
    return (
        Alert.objects.filter(
            patient__nurse=user,
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


def get_nurse_alert_by_id(alert_id, user):
    try:
        alert = (
            Alert.objects
            .select_related("patient", "device")
            .get(id=alert_id, is_deleted=False)
        )
    except Alert.DoesNotExist:
        raise NotFound("Alert not found")

    if alert.patient.nurse != user:
        raise PermissionDenied("Access denied")

    return alert