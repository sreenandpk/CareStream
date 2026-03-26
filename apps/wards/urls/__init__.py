from django.urls import path, include

urlpatterns = [

    path(
        "admin/",
        include("apps.wards.urls.admin_urls"),
    ),

    path(
        "doctor/",
        include("apps.wards.urls.doctor_urls"),
    ),

    path(
        "nurse/",
        include("apps.wards.urls.nurse_urls"),
    ),

]