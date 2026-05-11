from django.urls import path
from apps.wards.views.admin_views import (
    AdminWardListCreateView,
    AdminWardDetailView,
)
from apps.wards.views.admin_shift_views import (
    AdminNurseShiftListCreateView,
    AdminNurseShiftDetailView,
)
urlpatterns = [
    path(
        "wards/",
        AdminWardListCreateView.as_view(),
        name="admin-ward-list-create",
    ),
    path(
        "wards/<int:ward_id>/",
        AdminWardDetailView.as_view(),
        name="admin-ward-detail",
    ),
    path(
        "shifts/",
        AdminNurseShiftListCreateView.as_view(),
        name="admin-nurse-shift-list-create",
    ),
    path(
        "shifts/<int:shift_id>/",
        AdminNurseShiftDetailView.as_view(),
        name="admin-nurse-shift-detail",
    ),
]