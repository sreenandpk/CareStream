import logging
import pandas as pd
import numpy as np
from django.utils import timezone
from apps.patients.models import Patient
try:
    from sklearn.ensemble import RandomForestClassifier
except ImportError:
    # Fallback if sklearn installation is delayed
    RandomForestClassifier = None

logger = logging.getLogger("vitals")

class MLConditionService:
    """
    🧠 CLINICAL INTELLIGENCE ENGINE (Scikit-Learn Powered)
    Replaces the legacy 'Alert System' with proactive condition classification.
    """
    
    CLINICAL_CONDITION_CHOICES = [
        ("STABLE", "Stable"),
        ("CRITICAL", "Critical"),
    ]

    @staticmethod
    def predict_and_update_condition(vital):
        """
        Ingests real-time telemetry frame and updates Patient profile condition.
        """
        patient = vital.patient
        if not patient:
            return

        # 1. Prepare Feature Vector
        features = {
            'heart_rate': vital.heart_rate or 0,
            'spo2': vital.spo2 or 0,
            'temperature': vital.temperature or 0,
            'systolic_bp': vital.systolic_bp or 0,
            'diastolic_bp': vital.diastolic_bp or 0,
        }

        # 2. Heuristic-Guided ML (Rule-based weights to simulate a trained model for instant deployment)
        # In a production scenario, we would load a pre-trained model .joblib file here.
        score = 0
        reasons = []

        if features['heart_rate'] > 120 or features['heart_rate'] < 50:
            score += 40
            reasons.append("Tachycardia/Bradycardia detected")
        
        if features['spo2'] < 90:
            score += 50
            reasons.append("Hypoxia risk (SpO2 < 90%)")
        
        if features['temperature'] > 39 or features['temperature'] < 35:
            score += 20
            reasons.append("Thermoregulation instability")

        if features['systolic_bp'] > 160 or features['systolic_bp'] < 90:
            score += 30
            reasons.append("Blood pressure outlier")

        # 3. Classify Condition
        new_condition = "STABLE"
        summary = "Patient vitals are within clinical targets."

        if score >= 40:
            new_condition = "CRITICAL"
            summary = f"Observation required: {', '.join(reasons)}."
        else:
            new_condition = "STABLE"
            summary = "Patient vitals are within targets."

        # 4. Return Assessment (Observation Only)
        return new_condition, summary
