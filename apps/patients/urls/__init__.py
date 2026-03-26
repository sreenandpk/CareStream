from django.urls import path, include

urlpatterns = [

    path(
        "",
        include("apps.patients.urls.admin_urls"),
    ),
     path(
        "",
        include("apps.patients.urls.doctor_urls"),
    ),
     path(
        "",
        include("apps.patients.urls.nurse_urls"),
    ),

]