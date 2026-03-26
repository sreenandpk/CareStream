from django.urls import path, include
urlpatterns = [
    path(
        "",
        include("apps.devices.urls.admin_urls"),
    ),
    path(
        "",
        include("apps.devices.urls.doctor_urls"),
    ),
    path(
        "",
        include("apps.devices.urls.nurse_urls"),
    ),
]