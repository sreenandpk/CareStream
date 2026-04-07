from django.urls import path
from apps.wards.views.nurse_views import (
    NurseWardListView,
    NurseWardDetailView,
)

urlpatterns = [
    path("wards/", NurseWardListView.as_view()),
    path("wards/<int:ward_id>/", NurseWardDetailView.as_view()),
]