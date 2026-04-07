from django.urls import path
from apps.wards.views.admin_views import (
    AdminWardListCreateView,
    AdminWardDetailView,
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
]