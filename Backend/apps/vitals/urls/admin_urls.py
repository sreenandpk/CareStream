from django.urls import path
from apps.vitals.views.admin_views import (
    AdminVitalListCreateView,
    AdminVitalDetailView,
)

from apps.vitals.views.shared_views import (
    VitalsSnapshotView,
    VitalsHistoryView,
)

urlpatterns = [
    path(
        "snapshot/",
        VitalsSnapshotView.as_view(),
    ),
    path(
        "history/",
        VitalsHistoryView.as_view(),
    ),
    path(
        "vitals/",
        AdminVitalListCreateView.as_view(),
    ),
    path(
        "vitals/<int:vital_id>/",
        AdminVitalDetailView.as_view(),
    ),
]