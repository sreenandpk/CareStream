import os
from django.core.asgi import get_asgi_application

# 🔥 SET SETTINGS FIRST
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# 🔥 Initialize Django ASGI application early
django_asgi_app = get_asgi_application()

# 🔥 NOW IMPORT CHANNELS & PROJECT MODULES (after get_asgi_application)
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from apps.core.middleware.jwt_auth_middleware import JWTAuthMiddleware
from apps.core.consumers.log_consumer import LogConsumer
import apps.alerts.routing
import apps.vitals.routing
import apps.accounts.routing

# 🔥 FINAL APPLICATION
print("ASGI SERVER STARTING: WebSocket Layer Active")

application = ProtocolTypeRouter({
    "http": django_asgi_app,

    "websocket": JWTAuthMiddleware(
        URLRouter([
            path("ws/logs/", LogConsumer.as_asgi()),
            *apps.alerts.routing.websocket_urlpatterns,
            *apps.vitals.routing.websocket_urlpatterns,
            *apps.accounts.routing.websocket_urlpatterns,
        ])
    ),
})