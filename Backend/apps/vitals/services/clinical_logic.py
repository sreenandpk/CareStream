
def derive_system_condition(vital):
    """
    🧠 CLINICAL RULES ENGINE (Auto-Layer)
    Derives machine-status from objective telemetry thresholds.
    """
    # 🏥 SIGNAL LOSS HANDLING
    if vital.heart_rate is None or vital.spo2 is None:
        return "TECHNICAL WARNING"

    # 🚨 CRITICAL THRESHOLDS
    if (vital.heart_rate >= 140 or vital.heart_rate <= 40 or 
        vital.spo2 <= 88):
        return "CRITICAL"
        
    # ⚠️ WARNING THRESHOLDS
    if (vital.heart_rate >= 120 or vital.heart_rate <= 50 or 
        vital.spo2 <= 92):
        return "WARNING"
        
    return "NORMAL"

from apps.alerts.services.ai_service import predictor

def get_clinical_suggestion(vital):
    """
    💡 AI SUGGESTION ENGINE (Powered by Scikit-Learn)
    Provides reasoning for condition upgrades using both rules and AI.
    """
    # 🏥 SIGNAL LOSS HANDLING
    if vital.heart_rate is None or vital.spo2 is None:
        return {
            "suggested_condition": "UNKNOWN",
            "reasons": ["Data Loss (Check Sensor)"],
            "ai_confidence": None
        }

    reasons = []
    
    # 1. AI PREDICTION LAYER
    is_at_risk, confidence, ai_explanation = predictor.predict_risk(vital)
    
    # 2. RULE-BASED LAYER (Backup/Explicit)
    suggested = "STABLE"
    
    if vital.heart_rate >= 140:
        reasons.append(f"Extreme Tachycardia (HR: {vital.heart_rate})")
        suggested = "CRITICAL"
    elif vital.heart_rate <= 40:
        reasons.append(f"Extreme Bradycardia (HR: {vital.heart_rate})")
        suggested = "CRITICAL"
        
    if vital.spo2 <= 88:
        reasons.append(f"Severe Hypoxia (SpO2: {vital.spo2}%)")
        suggested = "CRITICAL"
        
    if suggested != "CRITICAL" and (vital.heart_rate >= 120 or vital.spo2 <= 92 or is_at_risk):
        suggested = "GUARDED"
        if is_at_risk:
            reasons.append(f"AI RISK: {ai_explanation}")
        elif vital.heart_rate >= 120: 
            reasons.append("Sustained High HR")
        elif vital.spo2 <= 92: 
            reasons.append("Low Oxygen Saturation")
        
    return {
        "suggested_condition": suggested,
        "reasons": reasons,
        "ai_confidence": round(confidence, 2) if is_at_risk else None
    }
