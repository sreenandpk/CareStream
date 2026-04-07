from django.urls import path, include
urlpatterns = [
    path("admin/",include("apps.beds.urls.admin_urls"),),
    path("doctor/",include("apps.beds.urls.doctor_urls"),),
    path("nurse/",include("apps.beds.urls.nurse_urls"),),
]