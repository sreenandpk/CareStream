import os
import django
from django.conf import settings
import sys

# Setup Django
sys.path.append('c:/Users/SREENAND PK/Desktop/PROJECTS/CareStream/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.core.views.log_views import LogFileView
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model

User = get_user_model()
admin = User.objects.filter(role='ADMIN').first()

factory = APIRequestFactory()
request = factory.get('/api/core/logs/audit.log/', {'page': 1, 'page_size': 8})
force_authenticate(request, user=admin)

view = LogFileView.as_view()
response = view(request, filename='audit.log')

print(f"Status: {response.status_code}")
print(f"Data: {response.data}")
