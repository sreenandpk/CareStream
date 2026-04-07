from django.urls import path
from apps.devices.views.admin_views import (
    AdminDeviceListCreateView,
    AdminDeviceDetailView,
)
urlpatterns = [
    path(
        "devices/",
        AdminDeviceListCreateView.as_view(),
    ),
    path(
        "devices/<int:device_id>/",
        AdminDeviceDetailView.as_view(),
    ),
]