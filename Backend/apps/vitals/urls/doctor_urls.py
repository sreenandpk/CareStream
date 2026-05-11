from django.urls import path
from apps.vitals.views.doctor_views import (
    DoctorVitalListView,
    DoctorVitalDetailView,
)
from apps.vitals.views.shared_views import VitalsHistoryView

urlpatterns = [
    path("vitals/", DoctorVitalListView.as_view()),
    path("vitals/<int:vital_id>/", DoctorVitalDetailView.as_view()),
    path("history/", VitalsHistoryView.as_view()),
]