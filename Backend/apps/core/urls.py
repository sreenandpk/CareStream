from django.urls import path
from apps.core.views.log_views import LogFileView

urlpatterns = [
    path('logs/<str:filename>/', LogFileView.as_view(), name='log-detail'),
]
