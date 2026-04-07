from django.urls import path
from apps.patients.views.nurse_views import (
    NursePatientListView,
    NursePatientDetailView,
)

urlpatterns = [
    path("patients/", NursePatientListView.as_view()),
    path("patients/<int:patient_id>/", NursePatientDetailView.as_view()),
]