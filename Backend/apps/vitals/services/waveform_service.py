import math
import time
import random
from typing import Dict, List

class WaveformState:
    """
    🏥 PERSISTENT TELEMETRY STATE
    Ensures phase continuity across WebSocket packets.
    """
    def __init__(self):
        self.ecg_phase = 0.0
        self.pleth_phase = 0.0
        self.resp_phase = 0.0
        self.baseline_wander = 0.0
        self.last_hr = 75
        self.last_rr = 18

class WaveformEngine:
    """
    🧠 PHYSIOLOGICAL SYNTHESIS ENGINE (ICU Grade)
    Simulates high-fidelity medical telemetry with continuity and noise.
    """
    _states: Dict[str, WaveformState] = {}

    @classmethod
    def get_state(cls, device_id: str) -> WaveformState:
        if device_id not in cls._states:
            cls._states[device_id] = WaveformState()
        return cls._states[device_id]

    @staticmethod
    def generate_ecg_buffer(hr, points=100, device_id="default", quality="GOOD"):
        """💓 HIGH-FIDELITY ECG: Persistent Phase + P-QRS-T Morphology"""
        state = WaveformEngine.get_state(device_id)
        buffer = []
        
        # Guard for flatline
        if quality in ["NO_SIGNAL", "LOST"]:
            return [0.0] * points
            
        # 🧪 0-LAG INSTANT SPIKE: If HR is 0 but we have some signal (WEAK), prime with 75 BPM
        # This ensures the user sees waveforms immediately upon touching the sensor.
        if hr <= 0:
            hr = 75

        # Calculate step per point (100Hz sampling)
        # Cycle length in seconds = 60 / HR
        cycle_sec = 60.0 / hr
        step = 0.01 / cycle_sec  # Phase step for 10ms (100Hz)
        
        # Signal Quality Modifiers
        noise_floor = 0.02 if quality == "WEAK" else 0.005
        amp_mod = 0.6 if quality == "WEAK" else 1.0

        for _ in range(points):
            state.ecg_phase %= 1.0
            p = state.ecg_phase
            
            # --- PHYSIOLOGICAL MORPHOLOGY ---
            val = 0.0
            
            # P-Wave (Atrial Depolarization)
            if 0.02 <= p < 0.12:
                val = 0.08 * math.sin((p - 0.02) * (math.pi / 0.1))
            
            # Q-Wave
            elif 0.15 <= p < 0.17:
                val = -0.06 * math.sin((p - 0.15) * (math.pi / 0.02))
            
            # QRS Complex (Ventricular Depolarization) - Sharp Spike
            elif 0.17 <= p < 0.21:
                # Gaussian bell for QRS
                val = 1.0 * math.exp(-((p - 0.19)**2) / 0.00007)
            
            # S-Wave
            elif 0.21 <= p < 0.24:
                val = -0.15 * math.sin((p - 0.21) * (math.pi / 0.03))
            
            # T-Wave (Ventricular Repolarization) - Asymmetric
            elif 0.45 <= p < 0.70:
                # Asymmetric sine for T-wave
                t_p = (p - 0.45) / 0.25
                val = 0.22 * (math.sin(t_p * math.pi) + 0.1 * math.sin(t_p * 2 * math.pi))

            # --- CLINICAL ARTIFACTS ---
            # 1. Baseline Wander (Respiration-induced drift)
            state.baseline_wander += 0.002 * math.sin(time.time() * 0.5)
            val += (state.baseline_wander * 0.1)
            
            # 2. Micro-Noise (Telemetry texture)
            val += random.uniform(-noise_floor, noise_floor)
            
            buffer.append(float(round(val * amp_mod, 4)))
            state.ecg_phase += step
            
        return buffer

    @staticmethod
    def generate_pleth_buffer(hr, points=100, device_id="default", quality="GOOD"):
        """🌊 PLETHYSMOGRAM: Dicrotic Notch + Exponential Decay"""
        state = WaveformEngine.get_state(device_id)
        buffer = []
        
        if quality in ["NO_SIGNAL", "LOST"]:
            return [0.0] * points

        # 🧪 0-LAG INSTANT SPIKE
        if hr <= 0:
            hr = 75

        cycle_sec = 60.0 / hr
        step = 0.01 / cycle_sec
        amp_mod = 0.5 if quality == "WEAK" else 1.0

        for _ in range(points):
            state.pleth_phase %= 1.0
            p = state.pleth_phase
            
            # Rapid Systolic Upstroke
            if p < 0.15:
                val = math.sin(p * (math.pi / 0.3))
            # Dicrotic Notch & Diastolic Decay
            else:
                # Main decay
                val = math.exp(-3.0 * (p - 0.15))
                # Dicrotic Notch (Reflected wave)
                if 0.35 <= p < 0.55:
                    val += 0.15 * math.sin((p - 0.35) * (math.pi / 0.2))
            
            # Add micro-noise
            val += random.uniform(-0.005, 0.005)
            
            buffer.append(float(round(val * amp_mod, 4)))
            state.pleth_phase += step
            
        return buffer

    @staticmethod
    def generate_resp_buffer(rr, points=100, device_id="default"):
        """🌬️ RESPIRATION: Asymmetric Inhale/Exhale"""
        state = WaveformEngine.get_state(device_id)
        buffer = []
        
        if rr <= 0: return [0.5] * points
        
        cycle_sec = 60.0 / rr
        step = 0.01 / cycle_sec

        for _ in range(points):
            state.resp_phase %= 1.0
            p = state.resp_phase
            
            # Asymmetric Breath (Inhale faster than Exhale)
            if p < 0.4: # Inhale
                val = 0.5 * (1 + math.sin(p * (math.pi / 0.8) - (math.pi / 2)))
            else: # Exhale
                val = 0.5 * (1 + math.cos((p - 0.4) * (math.pi / 0.6)))
                
            val += random.uniform(-0.01, 0.01)
            buffer.append(float(round(val, 4)))
            state.resp_phase += step
            
        return buffer
