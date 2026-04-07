from django.urls import path
from apps.patients.views.doctor_views import (
    DoctorPatientListView,
    DoctorPatientDetailView,
)

urlpatterns = [
    path("patients/", DoctorPatientListView.as_view()),
    path("patients/<int:patient_id>/", DoctorPatientDetailView.as_view()),
]