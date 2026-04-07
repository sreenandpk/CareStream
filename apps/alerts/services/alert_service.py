from apps.alerts.models import Alert

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from django.utils import timezone
from datetime import timedelta


def check_and_create_alert(vital):

    alerts = []

    # HEART RATE
    if vital.heart_rate <= 40 or vital.heart_rate >= 150:
        alerts.append(create_alert(
            vital,
            "HEART_RATE_CRITICAL",
            f"Critical HR: {vital.heart_rate}",
            Alert.Severity.CRITICAL
        ))

    elif vital.heart_rate <= 50 or vital.heart_rate >= 120:
        alerts.append(create_alert(
            vital,
            "HEART_RATE_ABNORMAL",
            f"Abnormal HR: {vital.heart_rate}",
            Alert.Severity.HIGH
        ))

    # SPO2
    if vital.spo2 <= 85:
        alerts.append(create_alert(
            vital,
            "SPO2_CRITICAL",
            f"Critical SpO2: {vital.spo2}",
            Alert.Severity.CRITICAL
        ))

    elif vital.spo2 <= 92:
        alerts.append(create_alert(
            vital,
            "SPO2_LOW",
            f"Low SpO2: {vital.spo2}",
            Alert.Severity.HIGH
        ))

    # TEMPERATURE
    if vital.temperature >= 40:
        alerts.append(create_alert(
            vital,
            "FEVER_CRITICAL",
            f"Temp: {vital.temperature}",
            Alert.Severity.CRITICAL
        ))

    elif vital.temperature >= 38.5:
        alerts.append(create_alert(
            vital,
            "FEVER",
            f"Temp: {vital.temperature}",
            Alert.Severity.MEDIUM
        ))

    return alerts

def create_alert(vital, alert_type, message, severity):

    existing = Alert.objects.filter(
        patient=vital.patient,
        alert_type=alert_type,
        status=Alert.Status.ACTIVE,
        created_at__gte=timezone.now() - timedelta(seconds=30)
    ).first()

    if existing:
        print(f"⏳ Skipped duplicate alert: {alert_type}")
        return existing

    doctor = getattr(vital.patient, "doctor", None)

    alert = Alert.objects.create(
        device=vital.device,
        patient=vital.patient,
        vital=vital,
        doctor=doctor,
        alert_type=alert_type,
        message=message,
        severity=severity,
    )

    print(f"🚨 ALERT CREATED: {alert.alert_type}")

    # 🔥 WEBSOCKET SEND (MULTI GROUP 🚀)
    channel_layer = get_channel_layer()

    # 🔥 SEND TO MULTIPLE GROUPS
    groups = ["alerts_admin"]  # admin always gets

    if doctor:
        groups.append(f"alerts_doctor_{doctor.id}")

    for group in groups:
        async_to_sync(channel_layer.group_send)(
            group,
            {
                "type": "send_alert",
                "data": {
                    "id": alert.id,
                    "patient": alert.patient.name,
                    "type": alert.alert_type,
                    "severity": alert.severity,
                    "message": alert.message,
                }
            }
        )

    print(f"📡 ALERT SENT TO {groups}")

    return alert