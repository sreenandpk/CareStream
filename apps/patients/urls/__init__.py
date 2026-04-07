from django.urls import path, include

urlpatterns = [

    path(
        "admin/",
        include("apps.patients.urls.admin_urls"),
    ),
     path(
        "doctor/",
        include("apps.patients.urls.doctor_urls"),
    ),
     path(
        "nurse/",
        include("apps.patients.urls.nurse_urls"),
    ),

]