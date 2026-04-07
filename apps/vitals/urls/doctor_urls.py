from django.urls import path
from apps.vitals.views.doctor_views import (
    DoctorVitalListView,
    DoctorVitalDetailView,
)

urlpatterns = [
    path("vitals/", DoctorVitalListView.as_view()),
    path("vitals/<int:vital_id>/", DoctorVitalDetailView.as_view()),
]