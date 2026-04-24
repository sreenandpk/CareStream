from celery import shared_task
from apps.devices.models import Device
from apps.simulation.services.simulation_service import generate_vital_for_device


@shared_task
def run_simulation():
    """
    Periodic task to scan the fleet for active simulations.
    Pivoted to Device-centric architecture (ICU Standard).
    """
    # Find all active devices set to SIMULATION mode
    devices = Device.objects.filter(
        mode="SIMULATION",
        is_active=True,
        is_key_revoked=False,
    ).select_related("bed__patient")

    print(f"🔥 HEARTBEAT: Running simulation for {devices.count()} hardware units")

    for device in devices:
        generate_vital_for_device(device)