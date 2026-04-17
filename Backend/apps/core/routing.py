from django.urls import path
from apps.core.consumers.log_consumer import LogConsumer

websocket_urlpatterns = [
    path("ws/logs/", LogConsumer.as_asgi()),
]
