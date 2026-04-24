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
  const buffer: number[] = [];
  const cycleSec = 60.0 / rate;
  
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
      // 3. R-Peak (Ventricular contraction)
      if (0.17 <= p && p < 0.21) rawVal = 1.0 * Math.exp(-Math.pow(p - 0.19, 2) / 0.00007);
      // 4. S-Dip
      if (0.21 <= p && p < 0.24) rawVal = -0.15 * Math.sin((p - 0.21) * (Math.PI / 0.03));
      // 5. T-Wave
      if (0.4 <= p && p < 0.6) rawVal = 0.18 * Math.sin((p - 0.4) * (Math.PI / 0.2));
      
      // Micro-noise for realism
      rawVal += (Math.random() - 0.5) * 0.008;
    } else {
      // PPG (SpO2) Signal
      const cycle = 0.75; // Standard pulse shape basis
      const pSync = (t % cycle) / cycle;
      
      if (0.15 < pSync && pSync < 0.35) {
        rawVal = Math.sin((pSync - 0.15) * (Math.PI / 0.2));
      } else {
        rawVal = Math.exp(-(pSync > 0.35 ? pSync : pSync + 1.0 - 0.35) * 3) * 0.6;
        if (0.5 < pSync && pSync < 0.65) rawVal += 0.06 * Math.sin((pSync - 0.5) * (Math.PI / 0.15));
      }
      // Scale by clinical % basis
      rawVal = rawVal * (rate / 100.0);
    }

    const val = (lastVal * alpha) + (rawVal * (1 - alpha));
    lastVal = val;
    buffer.push(Number(val.toFixed(4)));
  }
  
  return buffer;
};
