from django.urls import path
from apps.beds.views.doctor_views import (
    DoctorBedListView,
    DoctorBedDetailView,
)

urlpatterns = [
    path("beds/", DoctorBedListView.as_view()),
    path("beds/<int:bed_id>/", DoctorBedDetailView.as_view()),
]