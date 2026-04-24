from django.urls import path
from apps.alerts.views.admin_views import (
    AdminAlertListView,
    AdminAlertDetailView,
    AdminAlertAcknowledgeView,
    AdminAlertResolveView,
)
urlpatterns = [
    path("", AdminAlertListView.as_view()),
    path("<int:alert_id>/", AdminAlertDetailView.as_view()),
    path("<int:alert_id>/acknowledge/", AdminAlertAcknowledgeView.as_view()),
    path("<int:alert_id>/resolve/", AdminAlertResolveView.as_view()),
]