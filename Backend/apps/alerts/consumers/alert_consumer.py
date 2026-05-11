import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

@database_sync_to_async
def get_active_wards(user):
    from apps.wards.models import NurseShift
    from django.utils import timezone
    now = timezone.now()
    return list(NurseShift.objects.filter(
        nurse=user,
        is_active=True,
        start_time__lte=now,
        end_time__gte=now
    ).values_list("ward_id", flat=True).distinct())


class AlertConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.group_name = None

        # 🔥 GET USER FROM JWT MIDDLEWARE
        user = self.scope.get("user")

        # ❌ NOT AUTHENTICATED → REJECT
        if not user or not user.is_authenticated:
            print("❌ Unauthorized WebSocket")
            await self.close()
            return

        # 🔥 AUTO GROUP BASED ON ROLE
        if user.role == "DOCTOR":
            self.group_name = f"alerts_doctor_{user.id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
        elif user.role == "NURSE":
            # 🔥 Ward-Based Alert Distribution
            active_wards = await get_active_wards(user)
            for w_id in active_wards:
                ward_group = f"alerts_ward_{w_id}"
                await self.channel_layer.group_add(ward_group, self.channel_name)
        else:
            self.group_name = "alerts_admin"
            await self.channel_layer.group_add(self.group_name, self.channel_name)

        await self.accept()

        print(f"✅ Alerts WebSocket connected → {self.group_name}")

    async def disconnect(self, close_code):
        if self.group_name:
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

        print("❌ Alerts WebSocket disconnected")

    async def send_alert(self, event):
        print("📡 ALERT SENT TO FRONTEND:", event)

        await self.send(text_data=json.dumps(event["data"]))