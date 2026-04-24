from django.urls import path
from apps.devices.views.admin_views import (
    AdminDeviceListCreateView,
    AdminDeviceDetailView,
    AdminDeviceRotateKeyView,
    AdminDeviceRevokeKeyView,
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
    path(
        "devices/<int:device_id>/rotate-key/",
        AdminDeviceRotateKeyView.as_view(),
        name="device-rotate-key",
    ),
    path(
        "devices/<int:device_id>/revoke-key/",
        AdminDeviceRevokeKeyView.as_view(),
        name="device-revoke-key",
    ),
]