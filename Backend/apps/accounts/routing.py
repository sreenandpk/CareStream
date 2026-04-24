from django.urls import path
from .consumers.status_consumer import StatusConsumer

websocket_urlpatterns = [
    path("ws/status/", StatusConsumer.as_asgi()),
]
