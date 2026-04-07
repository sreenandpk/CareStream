from django.urls import path, include

urlpatterns = [
    # 🔴 ADMIN
    path(
        "admin/",
        include("apps.rooms.urls.admin_urls"),
    ),

    # 🔵 DOCTOR
    path(
        "doctor/",
        include("apps.rooms.urls.doctor_urls"),
    ),

    # 🟢 NURSE
    path(
        "nurse/",
        include("apps.rooms.urls.nurse_urls"),
    ),
]