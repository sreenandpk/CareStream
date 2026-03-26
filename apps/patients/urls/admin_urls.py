from django.urls import path
from apps.patients.views.admin_views import (
    AdminPatientListCreateView,
    AdminPatientDetailView,
)
urlpatterns = [
    path(
        "admin/patients/",
        AdminPatientListCreateView.as_view(),
    ),
    path(
        "admin/patients/<int:patient_id>/",
        AdminPatientDetailView.as_view(),
    ),
]