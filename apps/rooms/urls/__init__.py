from django.urls import path, include

urlpatterns = [

    path(
        "",
        include("apps.rooms.urls.admin_urls"),
    ),

    path(
        "",
        include("apps.rooms.urls.doctor_urls"),
    ),

    path(
        "",
        include("apps.rooms.urls.nurse_urls"),
    ),

]