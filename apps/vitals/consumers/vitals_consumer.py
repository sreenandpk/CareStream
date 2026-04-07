import json
from channels.generic.websocket import AsyncWebsocketConsumer


class VitalsConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.group_name = None

        user = self.scope.get("user")

        # ❌ Reject if not authenticated
        if not user or not user.is_authenticated:
            print("❌ Unauthorized Vitals WebSocket")
            await self.close()
            return

        # 🔥 ROLE-BASED GROUP
        if user.role == "DOCTOR":
            self.group_name = f"vitals_doctor_{user.id}"
        else:
            self.group_name = "vitals_admin"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

        print(f"✅ Vitals WS connected → {self.group_name}")

    async def disconnect(self, close_code):
        if self.group_name:
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def send_vital(self, event):
        await self.send(text_data=json.dumps(event["data"]))