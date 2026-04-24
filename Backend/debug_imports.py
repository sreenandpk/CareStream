
import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

def debug_imports():
    print("--- [DIAGNOSTIC] Testing Module Imports ---")
    try:
        print("Importing Device model...")
        from apps.devices.models import Device
        print("Importing AdminDeviceSerializer...")
        from apps.devices.serializers.admin_serializers import AdminDeviceSerializer
        print("Importing AdminDeviceListCreateView...")
        from apps.devices.views.admin_views import AdminDeviceListCreateView
        print("Testing Serializer Instantiation...")
        d = Device.objects.first()
        if d:
            s = AdminDeviceSerializer(d)
            print(f"Serialized keys: {s.data.keys()}")
        else:
            print("No devices found to test instantiation.")
            
        print("--- [DIAGNOSTIC] All imports and instantiations SUCCESSFUL ---")
    except Exception as e:
        print(f"!!! [CRITICAL ERROR] Import/Instantiation failed:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_imports()
