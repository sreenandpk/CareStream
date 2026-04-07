import random
from apps.vitals.services.vital_service import create_vital


# -------------------------
# 🔥 GENERATE VITAL (ONLY FUNCTION)
# -------------------------
def generate_vital_for_patient(patient):

    device = getattr(patient.bed, "device", None)

    if not device:
        return None

    if patient.mode != "SIMULATION":
        return None

    vital_data = {
        "device": device,
        "patient": patient,
        "source": "SIMULATION",
        "heart_rate": random.randint(60, 140),
        "spo2": random.randint(85, 100),
        "respiratory_rate": random.randint(12, 30),
        "temperature": round(random.uniform(36.0, 40.0), 1),
        "systolic_bp": random.randint(90, 180),
        "diastolic_bp": random.randint(60, 120),
    }

    return create_vital(vital_data, user=None)