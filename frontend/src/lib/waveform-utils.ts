/**
 * 🩺 CLINICAL WAVEFORM UTILITIES
 * Deterministic generation of physiological signals for graph continuity.
 * Mirrored from the backend WaveformGenerator for perfect cross-platform sync.
 */

export const generateSyntheticWaveform = (
  type: "ECG" | "PPG",
  rate: number,
  points: number = 300,
  baseTime: number = Date.now()
): number[] => {
  // 🏥 FLATLINE GUARD: If sensor reports 0 HR, return dead flatline
  const effectiveRate = (!rate || rate <= 0) ? 75 : rate;

  const buffer: number[] = [];
  const cycleSec = 60.0 / effectiveRate;
  
  // Smoothing alpha
  const alpha = 0.7;
  let lastVal = 0.0;

  for (let i = 0; i < points; i++) {
    // ⏱ Time basis: backfill at 100Hz (10ms steps)
    const t = (baseTime / 1000) + (i * 0.01);
    const p = (t % cycleSec) / cycleSec;
    
    let rawVal = 0.0;

    if (type === "ECG") {
      // 1. P-Wave
      if (0.02 <= p && p < 0.12) rawVal = 0.08 * Math.sin((p - 0.02) * (Math.PI / 0.1));
      // 2. Q-Dip
      if (0.15 <= p && p < 0.17) rawVal = -0.06 * Math.sin((p - 0.15) * (Math.PI / 0.02));
      // 3. R-Peak (Gaussian Sharpness)
      if (0.17 <= p && p < 0.21) rawVal = 1.0 * Math.exp(-Math.pow(p - 0.19, 2) / 0.00007);
      // 4. S-Dip
      if (0.21 <= p && p < 0.24) rawVal = -0.15 * Math.sin((p - 0.21) * (Math.PI / 0.03));
      // 5. T-Wave (Asymmetric)
      if (0.45 <= p && p < 0.70) {
        const tP = (p - 0.45) / 0.25;
        rawVal = 0.22 * (Math.sin(tP * Math.PI) + 0.1 * Math.sin(tP * 2 * Math.PI));
      }
      
      rawVal += (Math.random() - 0.5) * 0.01; // Micro-noise
    } else {
      // 🌊 PPG (Pleth) - ICU Grade
      if (p < 0.15) {
        rawVal = Math.sin(p * (Math.PI / 0.3)); // Systolic Upstroke
      } else {
        rawVal = Math.exp(-3.0 * (p - 0.15)); // Diastolic Decay
        if (0.35 <= p && p < 0.55) {
          rawVal += 0.15 * Math.sin((p - 0.35) * (Math.PI / 0.2)); // Dicrotic Notch
        }
      }
      rawVal *= 0.8;
      rawVal += (Math.random() - 0.5) * 0.005;
    }

    const val = rawVal;
    lastVal = val;
    buffer.push(Number(val.toFixed(4)));
  }
  
  return buffer;
};
