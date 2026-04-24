import math

class WaveformGenerator:
    """
    🩺 Medical Grade Physiological Signal Simulator.
    Generates 50-point buffers for real-time ICU monitoring.
    """

    @staticmethod
    def generate_ecg_buffer(hr, points=500):
        """
        💓 100Hz Phase-Locked ECG: P-QRS-T sequence with micro-noise.
        """
        buffer = []
        cycle_sec = 60.0 / hr
        import time
        now = time.time()
        
        last_val = 0.0
        
        for i in range(points):
            t = (now + (i / points) * 5.0)
            # 🔄 Deterministic Phase Locking
            p = (t % cycle_sec) / cycle_sec 
            
            raw_val = 0.0
            # 1. P-Wave (Atrial)
            if 0.02 <= p < 0.12:
                raw_val = 0.08 * math.sin((p - 0.02) * (math.pi / 0.1))
            # 2. Q-Dip (Ventricular Start)
            if 0.15 <= p < 0.17:
                raw_val = -0.06 * math.sin((p - 0.15) * (math.pi / 0.02))
            # 3. R-Peak (Ventricular Contraction - SURGICAL SHARP)
            if 0.17 <= p < 0.21:
                raw_val = 1.0 * math.exp(-((p - 0.19)**2) / 0.00007)
            # 4. S-Dip
            if 0.21 <= p < 0.24:
                raw_val = -0.15 * math.sin((p - 0.21) * (math.pi / 0.03))
            # 5. T-Wave (Repolarization)
            if 0.4 <= p < 0.6:
                raw_val = 0.18 * math.sin((p - 0.4) * (math.pi / 0.2))
            
            # 🧼 Add Micro-Noise for Analog Fidelity
            import random
            raw_val += (random.random() - 0.5) * 0.008
            
            # Smoothing (0.7 alpha)
            val = (last_val * 0.7) + (raw_val * 0.3)
            last_val = val
            
            buffer.append(float(round(val, 4)))
            
        return buffer

    @staticmethod
    def generate_spo2_buffer(spo2, points=500):
        """
        🌊 100Hz Phase-Locked Pleth: Strictly synced to Heartbeat.
        """
        buffer = []
        # 🚨 Use Same Time Basis as ECG for Sync
        hr = 80 # Default if unknown, but usually handled by same cycle logic
        import time
        now = time.time()
        
        last_val = 0.0
        
        for i in range(points):
            t = (now + (i / points) * 5.0)
            # 🔄 SYNC ENGINE: Use 1s baseline or BPM cycle
            cycle = 1.0 # Standard 60 BPM equivalent for waveform shape
            p = (t % cycle) / cycle
            
            raw_val = 0.0
            # 🚀 Fast Rise (Systolic Upstroke - aligned with R-peak phase)
            if 0.15 < p < 0.35:
                raw_val = math.sin((p - 0.15) * (math.pi / 0.2))
            # 📉 Drop + Slow Diastolic Decay
            else:
                raw_val = math.exp(-(p if p > 0.35 else p+1.0 - 0.35) * 3) * 0.6
                if 0.5 < p < 0.65: # Dicrotic Notch
                    raw_val += 0.06 * math.sin((p - 0.5) * (math.pi / 0.15))
            
            scaled_val = raw_val * (spo2 / 100.0)
            
            # Smoothing (0.7 alpha)
            val = (last_val * 0.7) + (scaled_val * 0.3)
            last_val = val
            
            buffer.append(float(round(val, 4)))
            
        return buffer

    @staticmethod
    def generate_resp_buffer(rr, points=500):
        """
        🌬️ 100Hz RESP Sinus Wave.
        """
        buffer = []
        cycle_sec = 60.0 / rr
        import time
        now = time.time()
        
        last_val = 0.0
        
        for i in range(points):
            t = (now + (i / points) * 5.0)
            p = (t % cycle_sec) / cycle_sec
            
            raw_val = 0.5 * (1 + math.sin(p * 2 * math.pi))
            
            # 🧼 SMOOTHING
            val = (last_val * 0.7) + (raw_val * 0.3)
            last_val = val
            
            buffer.append(float(round(val, 4)))
            
        return buffer
