from django.urls import path
from apps.beds.views.admin_views import (
    AdminBedListCreateView,
    AdminBedDetailView,
)
urlpatterns = [
    path(
        "beds/",
        AdminBedListCreateView.as_view(),
    ),
    path(
        "beds/<int:bed_id>/",
        AdminBedDetailView.as_view(),
    ),
]