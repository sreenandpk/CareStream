import random
import logging
from django.utils import timezone

from apps.vitals.services.vital_service import create_vital

logger = logging.getLogger(__name__)


CLINICAL_PATTERNS = {
    "NORMAL": {
        "heart_rate": (60, 100),
        "spo2": (95, 100),
        "respiratory_rate": (12, 18),
        "temperature": (36.5, 37.5),
        "systolic": (110, 130),
        "diastolic": (70, 85),
    },
    "CRITICAL": {
        "heart_rate": (140, 190),
        "spo2": (75, 88),
        "respiratory_rate": (28, 45),
        "temperature": (39.5, 41.0),
        "systolic": (180, 240),
        "diastolic": (100, 140),
    },
    "RECOVERY": {
        "heart_rate": (90, 120),
        "spo2": (90, 94),
        "respiratory_rate": (20, 26),
        "temperature": (37.8, 38.5),
        "systolic": (130, 150),
        "diastolic": (85, 95),
    },
    "GLOBAL": {
        "heart_rate": (60, 140),
        "spo2": (85, 100),
        "respiratory_rate": (12, 30),
        "temperature": (36.0, 40.0),
        "systolic": (90, 180),
        "diastolic": (60, 120),
    }
}


def smooth(prev, new, factor=0.7):
    if prev is None:
        return new
    return prev * factor + new * (1 - factor)


def generate_vital_for_device(device):
    try:
        # 🔒 Hardened Clinical Guard
        if not device.can_simulate:
            return None

        # ⏱ Rate limiting (Strict 5 sec cooldown)
        if device.last_simulated_at:
            delta = (timezone.now() - device.last_simulated_at).total_seconds()
            if delta < 5:
                return None

        # 🔧 Config Logic (Surgical Priority)
        config = getattr(device, "simulation_config", None)
        
        # 🔥 If EITHER the device OR the config is set to a special mode, prioritize it over NORMAL/GLOBAL
        primary_mode = device.simulation_mode
        config_mode = config.mode if config else None
        
        mode = "NORMAL"
        if "CRITICAL" in [primary_mode, config_mode]:
            mode = "CRITICAL"
        elif "RECOVERY" in [primary_mode, config_mode]:
            mode = "RECOVERY"
        elif config_mode and config_mode != "NORMAL":
            mode = config_mode
        else:
            mode = primary_mode if primary_mode != "GLOBAL" else "NORMAL"

        if config and mode == "NORMAL":
            ranges = {
                "heart_rate": (config.heart_rate_min, config.heart_rate_max),
                "spo2": (config.spo2_min, config.spo2_max),
                "respiratory_rate": (config.respiratory_rate_min, config.respiratory_rate_max),
                "temperature": (config.temperature_min, config.temperature_max),
                "systolic": (config.systolic_bp_min, config.systolic_bp_max),
                "diastolic": (config.diastolic_bp_min, config.diastolic_bp_max),
            }
            trend = config.trend
            variability = config.variability
        else:
            ranges = CLINICAL_PATTERNS.get(
                mode,
                CLINICAL_PATTERNS["GLOBAL"]
            )
            trend = config.trend if config else "STABLE"
            variability = config.variability if config else 0.02

        def get_value(v_min, v_max):
            val = random.uniform(v_min, v_max)
            noise = random.uniform(-1, 1) * variability * (v_max - v_min)
            return max(v_min, min(v_max, val + noise))

        patient = getattr(device.bed, "patient", None) if device.bed else None

        # 🔥 HEART RATE
        raw_hr = get_value(*ranges["heart_rate"])
        if trend == "WORSENING":
            raw_hr += 2
        elif trend == "IMPROVING":
            raw_hr -= 1

        heart_rate = int(smooth(device.last_hr, raw_hr))
        device.last_hr = heart_rate

        # 🔥 SPO2
        raw_spo2 = get_value(*ranges["spo2"])
        if trend == "WORSENING":
            raw_spo2 -= 1.5
        elif trend == "IMPROVING":
            raw_spo2 += 1

        spo2 = int(smooth(device.last_spo2, raw_spo2))
        device.last_spo2 = spo2

        # 🔥 TEMP
        temperature = round(smooth(device.last_temp, get_value(*ranges["temperature"])), 1)
        device.last_temp = temperature

        # 🔥 RR
        respiratory_rate = int(smooth(device.last_rr, get_value(*ranges["respiratory_rate"])))
        device.last_rr = respiratory_rate

        # 🔥 BP
        systolic = int(smooth(device.last_sys, get_value(*ranges["systolic"])))
        device.last_sys = systolic

        diastolic = int(smooth(device.last_dia, get_value(*ranges["diastolic"])))
        device.last_dia = diastolic

        # 💾 SAVE STATE
        device.last_simulated_at = timezone.now()
        device.save(update_fields=[
            "last_hr", "last_spo2", "last_temp",
            "last_rr", "last_sys", "last_dia",
            "last_simulated_at"
        ])

        # 📦 BUILD VITAL
        vital_data = {
            "device": device,
            "patient": patient,
            "source": "SIMULATION",
            "heart_rate": heart_rate,
            "spo2": spo2,
            "respiratory_rate": respiratory_rate,
            "temperature": temperature,
            "systolic_bp": systolic,
            "diastolic_bp": diastolic,
        }

        logger.info(f"SIM[{trend}] {device.serial_number} HR:{heart_rate} SpO2:{spo2}")

        return create_vital(vital_data, user=None)

    except Exception as e:
        logger.error(f"Simulation failed for {device.serial_number}: {str(e)}")
        return None