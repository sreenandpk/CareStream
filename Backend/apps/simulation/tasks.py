from celery import shared_task
from apps.patients.models import Patient
from apps.simulation.services.simulation_service import generate_vital_for_patient


@shared_task
def run_simulation():

    patients = Patient.objects.filter(
        mode="SIMULATION",
        is_active=True,
        is_deleted=False,
    ).select_related("bed__device")

    print(f"🔥 Running simulation for {patients.count()} patients")

    for patient in patients:
        generate_vital_for_patient(patient)