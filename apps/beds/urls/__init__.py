from django.urls import path, include
urlpatterns = [
    path("",include("apps.beds.urls.admin_urls"),),
    path("",include("apps.beds.urls.doctor_urls"),),
    path("",include("apps.beds.urls.nurse_urls"),),
]