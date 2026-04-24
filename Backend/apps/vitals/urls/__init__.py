from django.urls import path, include

urlpatterns = [
    path(
        "admin/",
        include("apps.vitals.urls.admin_urls"),
    ),
    path(
        "doctor/",
        include("apps.vitals.urls.doctor_urls"),
    ),
    path(
        "nurse/",
        include("apps.vitals.urls.nurse_urls"),
    ),
    path(
        "device/",
        include("apps.vitals.urls.device_urls"),
    ),
]