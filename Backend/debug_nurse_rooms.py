import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from apps.wards.models import NurseShift, Ward
from apps.rooms.views.nurse_views import NurseRoomListView
from rest_framework.test import APIRequestFactory, force_authenticate

def test_room_list():
    # Find a nurse who has a shift (even if not active now, we'll force one for testing)
    nurse = User.objects.filter(role='NURSE').first()
    if not nurse:
        print("No nurse found")
        return
    
    ward = Ward.objects.first()
    if ward:
        # Create a mock active shift for testing
        now = timezone.now()
        NurseShift.objects.update_or_create(
            nurse=nurse,
            ward=ward,
            defaults={
                'start_time': now - timezone.timedelta(hours=1),
                'end_time': now + timezone.timedelta(hours=1),
                'shift_type': 'DAY',
                'is_active': True
            }
        )
        print(f"Created/Verified active shift for {nurse.username} in {ward.name}")

    factory = APIRequestFactory()
    view = NurseRoomListView.as_view()
    
    # Test with ward filter
    params = {'ward': str(ward.id)} if ward else {}
    request = factory.get('/api/rooms/nurse/rooms/', params)
    force_authenticate(request, user=nurse)
    
    print(f"Testing with params: {params}")
    try:
        response = view(request)
        print(f"Status Code: {response.status_code}")
        print(f"Data: {response.data}")
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test_room_list()
