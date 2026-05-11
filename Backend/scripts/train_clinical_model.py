import os
import sys
import django
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# 1. Setup Django Environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.vitals.models import Vital

def train_model():
    print("AI TRAINING ENGINE: Loading clinical dataset...")
    
    vitals = Vital.objects.all().values(
        'heart_rate', 'spo2', 'temperature'
    )
    if not vitals.exists():
        print("Error: No data found in database to train on.")
        return

    df = pd.DataFrame(list(vitals))
    
    # Fill missing values with clinical defaults
    df['heart_rate'] = df['heart_rate'].fillna(75)
    df['spo2'] = df['spo2'].fillna(98)
    df['temperature'] = df['temperature'].fillna(36.6)

    # 3. HEURISTIC LABELING (Since we don't have human labels)
    # Target: 1 = High Risk, 0 = Stable
    def label_risk(row):
        # AI Logic: Multi-factor instability
        risk_score = 0
        if row['heart_rate'] > 110 or row['heart_rate'] < 55: risk_score += 1
        if row['spo2'] < 93: risk_score += 1
        if row['temperature'] > 38.5 or row['temperature'] < 35.5: risk_score += 1
        
        return 1 if risk_score >= 2 else 0

    print("Labeling data using Clinical Risk Heuristics...")
    df['target'] = df.apply(label_risk, axis=1)

    # 4. Train Model
    X = df[['heart_rate', 'spo2', 'temperature']]
    y = df['target']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print(f"Training RandomForestClassifier on {len(X_train)} clinical frames...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # 5. Save Model
    model_path = os.path.join("apps", "alerts", "ai_models", "clinical_risk_v1.pkl")
    joblib.dump(model, model_path)
    
    accuracy = model.score(X_test, y_test)
    print(f"AI MODEL SECURED: {model_path}")
    print(f"Model Accuracy: {accuracy * 100:.2f}%")

if __name__ == "__main__":
    train_model()
