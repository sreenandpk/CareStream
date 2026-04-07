from django.urls import path
from apps.devices.views.nurse_views import (
    NurseDeviceListView,
    NurseDeviceDetailView,
)

urlpatterns = [
    path("devices/", NurseDeviceListView.as_view()),
    path("devices/<int:device_id>/", NurseDeviceDetailView.as_view()),
]