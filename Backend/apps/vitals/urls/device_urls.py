from django.urls import path
from apps.vitals.views.device_views import DeviceIngestionView

urlpatterns = [
    path(
        "ingest/",
        DeviceIngestionView.as_view(),
        name="device-ingest",
    ),
]
