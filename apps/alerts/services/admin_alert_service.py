from rest_framework.exceptions import NotFound
from apps.alerts.models import Alert


def get_all_alerts():
    return (
        Alert.objects
        .select_related("patient", "device", "doctor")
        .only(
            "id",
            "alert_type",
            "message",
            "severity",
            "status",
            "created_at",
            "patient__name",
            "device__serial_number",
            "doctor__username",
        )
        .order_by("-created_at")[:200]
    )


def get_alert_by_id(alert_id):
    try:
        return (
            Alert.objects
            .select_related("patient", "device", "doctor")
            .get(id=alert_id)
        )
    except Alert.DoesNotExist:
        raise NotFound("Alert not found")