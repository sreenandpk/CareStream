import os
import django

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

# 🔥 SET SETTINGS FIRST
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# 🔥 IMPORTANT: initialize Django
django.setup()

# 🔥 NOW IMPORT PROJECT MODULES (after setup)
from apps.core.middleware.jwt_auth_middleware import JWTAuthMiddleware
import apps.alerts.routing
import apps.vitals.routing

# 🔥 Django ASGI app
django_asgi_app = get_asgi_application()

# 🔥 FINAL APPLICATION
application = ProtocolTypeRouter({
    "http": django_asgi_app,

    "websocket": JWTAuthMiddleware(
        URLRouter(
            apps.alerts.routing.websocket_urlpatterns +
            apps.vitals.routing.websocket_urlpatterns
        )
    ),
})