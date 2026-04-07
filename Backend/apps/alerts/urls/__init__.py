
from django.urls import path, include

urlpatterns = [
    path("admin/", include("apps.alerts.urls.admin_urls")),
    path("doctor/", include("apps.alerts.urls.doctor_urls")),
    path("nurse/", include("apps.alerts.urls.nurse_urls")),
]