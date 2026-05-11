import logging
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from apps.alerts.models import Alert
from apps.alerts.services.ai_service import predictor

logger = logging.getLogger("alerts")


# 🔷 MASTER ENTRY POINT
def check_and_create_alert(vital):
    """
    🚨 3-LAYER CLINICAL INTELLIGENCE ENGINE
    Standardized Alert Flow: Resolve -> Detect -> Notify
    """
    # 🔥 Layer 0: Self-Healing (Auto-Resolve)
    resolve_alerts(vital)

    detections = []

    # 🔥 Layer 1: Threshold Detection (Immediate)
    detections.extend(_detect_thresholds(vital))

    # 🔥 Layer 2: Pattern Detection (Instability)
    detections.extend(_detect_patterns(vital))

    # 🔥 Layer 3: Trend Detection (Gradual Shift)
    detections.extend(_detect_trends(vital))

    # 🔥 Layer 4: AI Prediction (Predictive Intelligence)
    detections.extend(_detect_ai_risk(vital))

    created_alerts = []
    for d in detections:
        alert = _safe_create_alert(vital, d['type'], d['msg'], d['severity'])
        if alert:
            created_alerts.append(alert)

    return created_alerts


# 🔷 LAYER 1: THRESHOLDS
def _detect_thresholds(vital):
    issues = []
    
    # Heart Rate
    if vital.heart_rate is not None:
        if vital.heart_rate >= 140 or vital.heart_rate <= 40:
            issues.append({'type': 'HR_CRITICAL', 'msg': f'Critical HR: {vital.heart_rate}', 'severity': Alert.Severity.CRITICAL})
        elif vital.heart_rate >= 120 or vital.heart_rate <= 50:
            issues.append({'type': 'HR_ABNORMAL', 'msg': f'Abnormal HR: {vital.heart_rate}', 'severity': Alert.Severity.HIGH})
    
    # SpO2
    if vital.spo2 is not None:
        if vital.spo2 <= 88:
            issues.append({'type': 'SPO2_CRITICAL', 'msg': f'Critical SpO2: {vital.spo2}', 'severity': Alert.Severity.CRITICAL})
        elif vital.spo2 <= 92:
            issues.append({'type': 'SPO2_LOW', 'msg': f'Low SpO2: {vital.spo2}', 'severity': Alert.Severity.HIGH})
    
    # Fever
    if vital.temperature is not None:
        if vital.temperature >= 40.0:
            issues.append({'type': 'TEMP_CRITICAL', 'msg': f'Critical Temp: {vital.temperature}', 'severity': Alert.Severity.CRITICAL})
        elif vital.temperature >= 38.5:
            issues.append({'type': 'TEMP_HIGH', 'msg': f'High Temp: {vital.temperature}', 'severity': Alert.Severity.MEDIUM})

    return issues


# 🔷 LAYER 2: PATTERNS (Placeholder)
def _detect_patterns(vital):
    # Future: Detect Tachy-Brady cycles or SpO2 dips
    return []


# 🔷 LAYER 3: TRENDS (Placeholder)
def _detect_trends(vital):
    # Future: Detect gradual increase in HR over 5 mins
    return []


# 🔷 LAYER 4: AI PREDICTIVE RISK
def _detect_ai_risk(vital):
    is_at_risk, confidence, explanation = predictor.predict_risk(vital)
    
    # 🧪 TEST MODE: Lowered threshold to 0.4 for easier verification
    if is_at_risk and confidence > 0.4:
        logger.info(f"AI RISK DETECTED: {explanation} (Confidence: {confidence:.2f})")
        return [{
            'type': 'AI_DETERIORATION_RISK',
            'msg': f'AI Detect: {explanation} (Confidence: {confidence:.2f})',
            'severity': Alert.Severity.HIGH
        }]
    return []


# 🔷 AUTO-RESOLVE ENGINE
def resolve_alerts(vital):
    """
    Autonomous clinical resolution with 10s stability guard.
    """
    active_alerts = Alert.objects.filter(
        device=vital.device,
        status=Alert.Status.ACTIVE
    )

    for alert in active_alerts:
        # 🛡️ STABILITY GUARD: Resolve only if alert is older than 10s
        if alert.created_at > timezone.now() - timedelta(seconds=10):
            continue

        resolved = False
        
        # Clinical Normalization Rules
        if 'HR' in alert.alert_type and vital.heart_rate is not None and 50 < vital.heart_rate < 120:
            resolved = True
        elif 'SPO2' in alert.alert_type and vital.spo2 is not None and vital.spo2 > 92:
            resolved = True
        elif 'TEMP' in alert.alert_type and vital.temperature is not None and vital.temperature < 38.0:
            resolved = True

        if resolved:
            alert.resolve()
            send_alert_update(alert, "ALERT_RESOLVED")
            logger.info(f"Clinical Resolution: Alert {alert.id} cleared.")


# 🔷 BROADCAST & NOTIFICATION
def send_alert_update(alert, event_type):
    """
    Broadcasts clinical alerts via standardized Event Layer.
    event_type: ALERT_CREATED | ALERT_RESOLVED
    """
    try:
        channel_layer = get_channel_layer()
        doctor_id = getattr(alert.patient.doctor, "id", None) if alert.patient else None
        
        groups = ["alerts_admin"]
        if doctor_id:
            groups.append(f"alerts_doctor_{doctor_id}")

        # 🔥 BROADCAST TO WARD (Scoped Alerts)
        ward_id = alert.device.bed.room.ward.id if alert.device.bed and alert.device.bed.room else None
        if ward_id:
            groups.append(f"alerts_ward_{ward_id}")

        broadcast_payload = {
            "event": event_type,  # 🚨 PRODUCTION CONTRACT
            "data": {
                "id": alert.id,
                "patient": getattr(alert.patient, "name", "ANONYMOUS"),
                "device_serial": alert.device.serial_number,
                "monitor_label": alert.device.monitor_label,
                "type": alert.alert_type,
                "severity": alert.severity,
                "message": alert.message,
                "timestamp": alert.created_at.isoformat(),
            }
        }

        for group in groups:
            async_to_sync(channel_layer.group_send)(
                group,
                {
                    "type": "send_alert",
                    "data": broadcast_payload
                }
            )
        logger.info(f"Broadcast: {event_type} synced for alert {alert.id}")

    except Exception as e:
        logger.error(f"Alert Broadcast Failure: {str(e)}")


def _safe_create_alert(vital, alert_type, message, severity):
    try:
        # De-duplication: 30s window
        existing = Alert.objects.filter(
            device=vital.device,
            alert_type=alert_type,
            status=Alert.Status.ACTIVE,
            created_at__gte=timezone.now() - timedelta(seconds=30)
        ).first()

        if existing:
            return existing

        alert = Alert.objects.create(
            device=vital.device,
            patient=vital.patient,
            vital=vital,
            doctor=getattr(vital.patient, "doctor", None) if vital.patient else None,
            alert_type=alert_type,
            message=message,
            severity=severity,
        )
        
        send_alert_update(alert, "ALERT_CREATED")
        return alert
    except Exception as e:
        logger.error(f"Alert Persistence Error: {str(e)}")
        return None