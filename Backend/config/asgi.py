import os
import django

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

# 🔥 SET SETTINGS FIRST
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# 🔥 IMPORTANT: initialize Django
django.setup()

# 🔥 NOW IMPORT PROJECT MODULES (after setup)
from django.urls import path
from apps.core.middleware.jwt_auth_middleware import JWTAuthMiddleware
from apps.core.consumers.log_consumer import LogConsumer
import apps.alerts.routing
import apps.vitals.routing
import apps.accounts.routing

# 🔥 Django ASGI app
django_asgi_app = get_asgi_application()

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