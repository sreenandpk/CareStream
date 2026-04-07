from django.urls import path
from apps.alerts.views.doctor_views import (
    DoctorAlertListView,
    DoctorAlertDetailView,
    DoctorAlertAcknowledgeView,
    DoctorAlertResolveView,
)

urlpatterns = [
    path("", DoctorAlertListView.as_view()),
    path("<int:alert_id>/", DoctorAlertDetailView.as_view()),
    path("<int:alert_id>/acknowledge/", DoctorAlertAcknowledgeView.as_view()),
    path("<int:alert_id>/resolve/", DoctorAlertResolveView.as_view()),
]