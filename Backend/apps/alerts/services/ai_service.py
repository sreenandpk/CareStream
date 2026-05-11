import os
import joblib
import logging
import numpy as np

logger = logging.getLogger("alerts")

class ClinicalPredictor:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ClinicalPredictor, cls).__new__(cls)
            cls._load_model()
        return cls._instance

    @classmethod
    def _load_model(cls):
        model_path = os.path.join("apps", "alerts", "ai_models", "clinical_risk_v1.pkl")
        if os.path.exists(model_path):
            try:
                cls._model = joblib.load(model_path)
                logger.info("AI PREDICTOR: Clinical Risk Model loaded successfully.")
            except Exception as e:
                logger.error(f"AI PREDICTOR: Failed to load model: {str(e)}")
        else:
            logger.warning("AI PREDICTOR: Model file not found. AI alerts will be disabled.")

    def predict_risk(self, vital):
        """
        Predicts if a patient is at risk and provides a clinical explanation.
        Returns: (is_risk: bool, confidence: float, explanation: str)
        """
        if not self._model:
            return False, 0.0, ""

        # Features: [HR, SpO2, Temp]
        hr = vital.heart_rate or 75
        spo2 = vital.spo2 or 98
        temp = vital.temperature or 36.6

        features = np.array([[hr, spo2, temp]])

        try:
            prediction = self._model.predict(features)[0]
            probabilities = self._model.predict_proba(features)[0]
            confidence = probabilities[prediction]

            explanation = ""
            if prediction:
                # 🩺 CLINICAL EXPLAINABILITY ENGINE
                reasons = []
                if hr > 100: reasons.append("Tachycardia (Elevated HR)")
                if hr < 60: reasons.append("Bradycardia (Low HR)")
                if spo2 < 94: reasons.append("Hypoxia (Low SpO2)")
                if temp > 38.0: reasons.append("Hyperthermia (Fever)")
                
                if reasons:
                    explanation = "Combination of: " + ", ".join(reasons)
                else:
                    explanation = "Complex vital pattern instability detected."

            return bool(prediction), confidence, explanation
        except Exception as e:
            logger.error(f"AI Prediction Failure: {str(e)}")
            return False, 0.0, ""

# Singleton instance
predictor = ClinicalPredictor()
