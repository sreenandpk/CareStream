import json
from channels.generic.websocket import AsyncWebsocketConsumer


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
        elif user.role == "NURSE":
            self.group_name = f"alerts_nurse_{user.id}"
        else:
            self.group_name = "alerts_admin"

        # 🔥 JOIN GROUP
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

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