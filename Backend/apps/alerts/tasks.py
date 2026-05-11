from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging
from apps.alerts.models import Alert

logger = logging.getLogger("alerts")

@shared_task
def auto_resolve_stale_alerts(minutes=30):
    """
    🛡️ CLINICAL HYGIENE PROTOCOL
    Automatically resolves ACTIVE alerts older than the specified timeframe.
    Prevents alert fatigue and ensures the board reflects current status.
    """
    try:
        threshold = timezone.now() - timedelta(minutes=minutes)
        stale_alerts = Alert.objects.filter(
            is_active=True,
            status=Alert.Status.ACTIVE,
            created_at__lt=threshold
        )
        
        count = stale_alerts.count()
        if count > 0:
            for alert in stale_alerts:
                alert.resolve()
                logger.info(f"Auto-Resolved Stale Alert: {alert.id} ({alert.alert_type})")
                
            return f"Synchronized Clinical State: {count} stale alerts resolved."
        return "Clinical Oversight: 0 stale alerts detected."
        
    except Exception as e:
        logger.error(f"Alert Expiration Failure: {str(e)}")
        return str(e)
