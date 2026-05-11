import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger("vitals")

@database_sync_to_async
def get_active_wards(user):
    from apps.wards.models import NurseShift
    from django.utils import timezone
    now = timezone.now()
    wards = list(NurseShift.objects.filter(
        nurse=user,
        is_active=True,
        start_time__lte=now,
        end_time__gte=now
    ).values_list("ward_id", flat=True).distinct())
    
    # 🔥 STANDBY FALLBACK: If no active shift, allow observational oversight of assigned wards
    if not wards:
        from apps.wards.models import Ward
        wards = list(Ward.objects.filter(nurses=user).values_list('id', flat=True).distinct())
        logger.info(f"Vitals WS Standby: Nurse {user.username} observational in wards {wards}")
    else:
        logger.info(f"Vitals WS Discovery: Nurse {user.username} active in {len(wards)} wards")
    
    return wards

class VitalsConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.active_groups = []
        user = self.scope.get("user")

        # ❌ Reject if not authenticated
        if not user or not user.is_authenticated:
            logger.warning("Vitals WebSocket: Unauthorized connection attempt.")
            await self.close()
            return

        # 🔥 ROLE-BASED SCOPING
        if user.role == "DOCTOR":
            # Doctors are authorized for the global command center stream
            group = "vitals_admin"
            await self.channel_layer.group_add(group, self.channel_name)
            self.active_groups.append(group)
        elif user.role == "NURSE":
            # 🔥 Universal Telemetry Stream (Fidelity First Principle)
            # Nurses always receive the global stream to prevent 'Global View' 30s signal loss.
            group = "vitals_admin"
            await self.channel_layer.group_add(group, self.channel_name)
            self.active_groups.append(group)
            logger.info(f"Nurse {user.username} joined Global Telemetry Backbone.")

            # 🔥 Secondary Ward-Based Subscription (For targeted alerts/routing)
            active_wards = await get_active_wards(user)
            for w_id in active_wards:
                ward_group = f"vitals_ward_{w_id}"
                await self.channel_layer.group_add(ward_group, self.channel_name)
                self.active_groups.append(ward_group)
        else:
            group = "vitals_admin"
            await self.channel_layer.group_add(group, self.channel_name)
            self.active_groups.append(group)

        await self.accept()
        logger.info(f"Vitals WebSocket Accepted. Groups: {self.active_groups}")

    async def disconnect(self, close_code):
        if hasattr(self, 'active_groups'):
            for group in self.active_groups:
                await self.channel_layer.group_discard(
                    group,
                    self.channel_name
                )
            logger.info(f"Vitals WebSocket Disconnected. Cleaned up: {self.active_groups}")

    async def send_vital(self, event):
        """
        🚀 Telemetry Relay: Dispatches clinical frames to the client monitor.
        """
        try:
            # Standardize for Doctor Dashboard expectations
            data = event.get("data", {})
            if "event" not in data:
                data = {"event": "VITAL_UPDATE", "data": data}
            
            # 📡 FINAL RELAY AUDIT
            user = self.scope.get("user")
            print(f"📡 RELAYING TO {user.username if user else 'ANON'}: {json.dumps(data)[:100]}...")
            
            await self.send(text_data=json.dumps(data))
            
            node = data.get("data", {}).get("device", {}).get("serial", "UNKNOWN")
            logger.info(f"Relaying Pulse: {node} -> {self.scope['user'].username}")
        except Exception as e:
            logger.error(f"Relay Failure: {str(e)}")

    async def receive(self, text_data):
        """
        ⚡ NEXUS PING: Handles client-side latency probes for quality of service tracking.
        """
        try:
            payload = json.loads(text_data)
            if payload.get("event") == "PING":
                await self.send(text_data=json.dumps({
                    "event": "PONG",
                    "timestamp": payload.get("timestamp")
                }))
        except Exception as e:
            logger.error(f"Vitals WS Receive Error: {str(e)}")