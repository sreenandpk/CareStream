from django.urls import path
from apps.wards.views.doctor_views import (
    DoctorWardListView,
    DoctorWardDetailView,
)
urlpatterns = [
    path(
        "wards/",
        DoctorWardListView.as_view(),
    ),
    path(
        "wards/<int:ward_id>/",
        DoctorWardDetailView.as_view(),
    ),
]