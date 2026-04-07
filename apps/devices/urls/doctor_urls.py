from django.urls import path
from apps.devices.views.doctor_views import (
    DoctorDeviceListView,
    DoctorDeviceDetailView,
)

urlpatterns = [
    path("devices/", DoctorDeviceListView.as_view()),
    path("devices/<int:device_id>/", DoctorDeviceDetailView.as_view()),
]