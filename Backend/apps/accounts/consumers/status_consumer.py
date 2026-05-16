import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from apps.accounts.services.presence_service import PresenceService

User = get_user_model()

class StatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print(f"DEBUG: [STATUS_SOCKET] Connection attempt from {self.scope.get('user')}")
        self.user = self.scope.get("user")
        
        # Security: only authenticated users can join the status network
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        self.group_name = "user_status"

        # Join the global status group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

        # 🔥 [NON-BLOCKING] Offload presence tracking to background to ensure zero-lag handshake
        asyncio.create_task(self.register_presence())

    async def register_presence(self):
        try:
            is_first_connection = await database_sync_to_async(PresenceService.go_online)(
                self.user.id, self.channel_name
            )
            
            # Start Heartbeat Pulse (Every 30s)
            self.heartbeat_task = asyncio.create_task(self.heartbeat_loop())

            # 🔄 [SYNC] Send the current master list of online users
            all_online_ids = await database_sync_to_async(PresenceService.get_online_user_ids)()
            await self.send(text_data=json.dumps({
                "type": "presence_sync",
                "online_user_ids": all_online_ids
            }))

            if is_first_connection:
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "status_update",
                        "user_id": self.user.id,
                        "status": "online",
                        "username": self.user.username,
                        "last_login": self.user.last_login.isoformat() if self.user.last_login else None
                    }
                )
        except Exception as e:
            print(f"❌ [PRESENCE_ERROR] Failed to register: {str(e)}")

    async def heartbeat_loop(self):
        """Background pulse to keep the user alive in the global store."""
        try:
            while True:
                await asyncio.sleep(30)
                # 💓 [PULSE] Update the global 'heartbeat' timestamp for this user
                await database_sync_to_async(PresenceService.update_pulse)(self.user.id)
                # print(f"💓 [HEARTBEAT] User {self.user.id} pulsed.")
        except asyncio.CancelledError:
            pass

    async def disconnect(self, close_code):
        if hasattr(self, "heartbeat_task"):
            self.heartbeat_task.cancel()

        if hasattr(self, "group_name") and hasattr(self, "user"):
            # Leave the status group early
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

            # Mark this SPECIFIC tab as offline
            is_truly_offline = await database_sync_to_async(PresenceService.go_offline)(
                self.user.id, self.channel_name
            )

            if is_truly_offline:
                # Only broadcast if this was the user's VERY LAST open tab
                # Broadcast that this user is now truly offline
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "status_update",
                        "user_id": self.user.id,
                        "status": "offline",
                        "username": self.user.username,
                        "last_login": self.user.last_login.isoformat() if self.user.last_login else None
                    }
                )

    async def status_update(self, event):
        """
        Handle broadcasting a status change to the specific WebSocket instance.
        """
        # Send the status update data to the frontend
        await self.send(text_data=json.dumps({
            "type": event["type"],
            "user_id": event["user_id"],
            "status": event["status"],
            "username": event["username"],
            "last_login": event.get("last_login"),
            "email": event.get("email") # 🔥 FIX: Forward email for security alerts
        }))
