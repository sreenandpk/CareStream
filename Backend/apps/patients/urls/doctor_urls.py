from django.urls import path
from apps.patients.views.doctor_views import (
    DoctorPatientListView,
    DoctorPatientDetailView,
    DoctorMedicationView,
    DoctorNoteCreateView,
    ConditionUpdateView,
)

urlpatterns = [
    path("patients/", DoctorPatientListView.as_view()),
    # 🔥 CLINICAL INTERVENTION ENGINE
    path("patients/<int:patient_id>/meds/", DoctorMedicationView.as_view()),
    path("patients/<int:patient_id>/order-meds/", DoctorMedicationView.as_view()),
    path("patients/<int:patient_id>/notes/", DoctorNoteCreateView.as_view()),
    path("patients/<int:patient_id>/condition/", ConditionUpdateView.as_view()),
    
    # 🏥 General Detail View (Fallback)
    path("patients/<int:patient_id>/", DoctorPatientDetailView.as_view()),
]