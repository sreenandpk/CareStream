from django.urls import path
from apps.beds.views.nurse_views import (
    NurseBedListView,
    NurseBedDetailView,
)

urlpatterns = [
    path("beds/", NurseBedListView.as_view()),
    path("beds/<int:bed_id>/", NurseBedDetailView.as_view()),
]