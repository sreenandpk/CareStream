from django.urls import path, include

urlpatterns = [

    path(
        "",
        include("apps.vitals.urls.admin_urls"),
    ),

    path(
        "",
        include("apps.vitals.urls.doctor_urls"),
    ),

    path(
        "",
        include("apps.vitals.urls.nurse_urls"),
    ),

]