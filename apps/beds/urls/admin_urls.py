from django.urls import path
from apps.beds.views.admin_views import (
    AdminBedListCreateView,
    AdminBedDetailView,
)
urlpatterns = [
    path(
        "admin/beds/",
        AdminBedListCreateView.as_view(),
    ),
    path(
        "admin/beds/<int:bed_id>/",
        AdminBedDetailView.as_view(),
    ),
]