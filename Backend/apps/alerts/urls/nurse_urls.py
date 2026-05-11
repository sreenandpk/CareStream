from django.urls import path

from apps.alerts.views.nurse_views import (
    NurseAlertListView,
    NurseAlertDetailView,
    NurseAlertResolveView,
)

urlpatterns = [
    path("", NurseAlertListView.as_view()),
    path("<int:alert_id>/", NurseAlertDetailView.as_view()),
    path("<int:alert_id>/resolve/", NurseAlertResolveView.as_view()),
]