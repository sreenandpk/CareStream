from django.urls import path, include
urlpatterns = [
    path(
        "admin/",
        include("apps.devices.urls.admin_urls"),
    ),
    path(
        "doctor/",
        include("apps.devices.urls.doctor_urls"),
    ),
    path(
        "nurse/",
        include("apps.devices.urls.nurse_urls"),
    ),
]