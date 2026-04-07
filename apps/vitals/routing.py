from django.urls import path
from apps.vitals.consumers.vitals_consumer import VitalsConsumer

websocket_urlpatterns = [
    path("ws/vitals/", VitalsConsumer.as_asgi()),
]