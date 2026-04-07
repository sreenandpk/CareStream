from django.urls import path
from apps.vitals.views.nurse_views import (
    NurseVitalListView,
    NurseVitalDetailView,
)

urlpatterns = [
    path("vitals/", NurseVitalListView.as_view()),
    path("vitals/<int:vital_id>/", NurseVitalDetailView.as_view()),
]