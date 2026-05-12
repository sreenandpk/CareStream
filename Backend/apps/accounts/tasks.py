from celery import shared_task
import time
import logging
from django.core.cache import cache
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger("app")
security_logger = logging.getLogger("security")

@shared_task
def validate_user_email_background(user_id, email):
    """
    🛡️ IDENTITY INTERCEPTOR (Background)
    Monitors for undeliverable email signals from SendGrid for 20 seconds.
    If a bounce is detected, the user is deactivated to protect the clinical registry.
    """
    start_time = time.time()
    bounce_reason = None
    email_lower = email.lower()
    
    logger.info(f"Background Identity Validation started for User ID {user_id} ({email})")
    
    # 🧪 LOCAL SIMULATION: If email contains test keywords and we are in debug, simulate a bounce
    from django.conf import settings
    if settings.DEBUG and any(word in email_lower for word in ["bounce", "fake", "test"]):
        logger.info(f"TESTING PROTOCOL: Simulating bounce for {email}")
        time.sleep(0.5) # Fast simulation for instant UI feedback
        cache.set(f"sec_block:{email_lower}", "Simulated Bounce (Local Test)", timeout=30)

    # 🕒 Polling loop (20 seconds) - High Frequency for instant UI response
    while time.time() - start_time < 20.0:
        bounce_reason = cache.get(f"sec_block:{email_lower}")
        if bounce_reason:
            logger.warning(f"Background Interceptor caught BOUNCE for {email} after {round(time.time() - start_time, 2)}s")
            break
        time.sleep(0.5) # Poll every 0.5s for instant updates
    
    if bounce_reason:
        try:
            user = User.objects.get(id=user_id)
            user.is_active = False
            user.email_status = "invalid"
            user.is_verified = False
            user.save()
            
            # 📡 REAL-TIME SIGNAL: Notify the Admin Dashboard via WebSockets
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            channel_layer = get_channel_layer()
            
            async_to_sync(channel_layer.group_send)(
                "user_status",
                {
                    "type": "status_update",
                    "user_id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "status": "invalid",
                    "reason": f"Email Deliverability Failure: {bounce_reason}"
                }
            )

            security_logger.warning(
                f"🚨 IDENTITY SHIELD: User '{user.username}' deactivated. "
                f"Email {email} is undeliverable. Reason: {bounce_reason}"
            )
            cache.delete(f"sec_block:{email_lower}")
            return f"User {user_id} deactivated due to email failure."
        except User.DoesNotExist:
            logger.error(f"Interceptor Task Failure: User {user_id} no longer exists.")
            return "User not found."
    
    # Update status to valid if no bounce
    try:
        user = User.objects.get(id=user_id)
        if user.email_status == "pending":
            user.email_status = "valid"
            user.save()
            
            # 📡 REAL-TIME SIGNAL: Notify the Admin Dashboard that user is VALID
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            channel_layer = get_channel_layer()
            
            async_to_sync(channel_layer.group_send)(
                "user_status",
                {
                    "type": "status_update",
                    "user_id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "status": "valid",
                    "reason": "Email Deliverability Verified"
                }
            )
            logger.info(f"Background Identity Validation cleared for User ID {user_id} ({email}).")
    except User.DoesNotExist:
        pass

    return f"User {user_id} email cleared."
