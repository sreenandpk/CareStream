# URL Configuration - Reloaded at 2026-04-23 11:15
from django.contrib import admin
from django.urls import path,include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from .sendgrid_webhook import sendgrid_webhook
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/',include('apps.accounts.urls')),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/",SpectacularSwaggerView.as_view(url_name="schema",template_name="swagger-ui.html"),name="swagger-ui",),
    path("api/redoc/",SpectacularRedocView.as_view(url_name="schema"), name="redoc",),
    path("api/wards/",include("apps.wards.urls"),),
    path("api/rooms/",include("apps.rooms.urls"),),
    path("api/beds/", include("apps.beds.urls")),
    path("api/patients/", include("apps.patients.urls")),
    path("api/devices/", include("apps.devices.urls")), 
    path("api/vitals/", include("apps.vitals.urls")), 
    path("api/alerts/", include("apps.alerts.urls")),
    path("api/core/", include("apps.core.urls")),
    path("api/sendgrid/webhook/", sendgrid_webhook),
]