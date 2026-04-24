from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt

from django.views.decorators.csrf import csrf_exempt
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

User = get_user_model()

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def sendgrid_webhook(request):
    """
    Professional SendGrid Webhook Handler
    Handles: Bounces, Drops, and Real-Time Dashboard updates
    """
    events = request.data
    channel_layer = get_channel_layer()
    print("\n" + "="*50)
    print(f"📧 [WEBHOOK HEARTBEAT] Received {len(events)} events from SendGrid")
    print("="*50)

    for event in events:
        email = event.get("email")
        event_type = event.get("event")
        reason = event.get("reason", "No reason provided")

        print("\n" + "!"*60)
        print(f"📢 [WEBHOOK RECEIVED] Event: {event_type.upper()} for {email}")
        print(f"   Reason: {reason}")
        print("!"*60 + "\n")



        # Block anything that indicates a bad address
        if event_type in ["bounce", "dropped", "spamreport"]:
            print(f"🛑 [IDENTITY BLOCKED] Flagging {email} as invalid.")
            
            # 🛡️ THE INTERCEPTOR SIGNAL: Write to Cache
            # This is what the CreateUserView will poll for during registration
            from django.core.cache import cache
            cache.set(f"sec_block:{email.lower()}", reason, timeout=30)


            # Update DB for existing users
            User.objects.filter(email=email).update(
                email_status="invalid",
                is_active=False
            )

            user = User.objects.filter(email=email).first()
            if user:
                # 1. Update Database Status
                user.is_active = False
                user.is_verified = False
                user.email_status = "invalid"  # 🔥 NEW: Professional tracking
                user.save()
                
                # 2. Real-Time Broadcast to Admin Dashboard
                async_to_sync(channel_layer.group_send)(
                    "user_status",
                    {
                        "type": "status_update",
                        "user_id": user.id,
                        "email": user.email,
                        "username": user.username,
                        "status": "invalid",
                        "reason": "Email address does not exist"
                    }
                )
                print(f"🛡️ Security Action: User {user.username} deactivated & Broadcasted.")

    return Response({"status": "processed"})