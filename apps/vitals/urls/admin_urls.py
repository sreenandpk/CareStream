from django.urls import path
from apps.vitals.views.admin_views import (
    AdminVitalListCreateView,
    AdminVitalDetailView,
)
urlpatterns = [
    path(
        "vitals/",
        AdminVitalListCreateView.as_view(),
    ),
    path(
        "vitals/<int:vital_id>/",
        AdminVitalDetailView.as_view(),
    ),
]