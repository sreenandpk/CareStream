from django.urls import path
from apps.vitals.views.admin_views import (
    AdminVitalListCreateView,
    AdminVitalDetailView,
)
urlpatterns = [
    path(
        "admin/vitals/",
        AdminVitalListCreateView.as_view(),
    ),
    path(
        "admin/vitals/<int:vital_id>/",
        AdminVitalDetailView.as_view(),
    ),
]