from django.urls import path
from apps.patients.views.nurse_views import (
    NursePatientListView,
    NursePatientDetailView,
    NurseClinicalNoteView,
    NurseMedicationOrderListView,
    NurseMedicationAdminView,
)

urlpatterns = [
    path("patients/", NursePatientListView.as_view()),
    path("patients/<int:patient_id>/", NursePatientDetailView.as_view()),
    path("patients/<int:patient_id>/notes/", NurseClinicalNoteView.as_view()),
    path("patients/<int:patient_id>/meds/", NurseMedicationOrderListView.as_view()),
    path("meds/<int:order_id>/administer/", NurseMedicationAdminView.as_view()),
]