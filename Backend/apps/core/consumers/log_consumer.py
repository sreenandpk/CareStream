import json
from channels.generic.websocket import AsyncWebsocketConsumer

class LogConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        print(f"DEBUG: LogConsumer Connection -> User: {user}, Auth: {user.is_authenticated if user else 'None'}, Role: {user.role if hasattr(user, 'role') else 'N/A'}")
        
        # Permissions check
        if not user or not user.is_authenticated or user.role != "ADMIN":
            print(f"DEBUG: LogConsumer REJECTED -> Missing required role.")
            await self.close()
            return

        self.group_name = "system_logs"
        
        # Join group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    # Receive message from room group
    async def log_message(self, event):
        message = event["message"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "message": message
        }))
