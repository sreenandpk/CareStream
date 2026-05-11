"use client";

import React, { useEffect, useRef } from "react";
import { generateSyntheticWaveform } from "@/lib/waveform-utils";

interface VitalWaveformProps {
  data: number[]; // 🚨 PRODUCTION: Incoming data chunks from WebSocket
  color: string;
  type: "ECG" | "PPG";
  height?: number;
  initialRate?: number; // Added to bootstrap the wave instantly
  state?: "LIVE" | "DELAYED" | "OFFLINE";
  isStale?: boolean;
  signalState?: string;
  isReview?: boolean;
}

/**
 * 🩺 Clinical Canvas Renderer
 * Implements a High-Fidelity "Sweep" effect mirroring real ICU hardware.
 */
export default function VitalWaveform({
  data = [],
  color,
  type,
  height = 50,
  initialRate = 60,
  state = "LIVE",
  isStale = false,
  signalState = "GOOD",
  isReview = false
}: VitalWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<number[]>([]);
  const lastIndexRef = useRef(0);
  const animationRef = useRef<number>(0);
  const lastValRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());
  const scanPosRef = useRef(0);

  // 📥 BOOTSTRAP: Fill initial buffer to prevent "blank" start
  useEffect(() => {
    if (bufferRef.current.length === 0) {
      // 🏥 CLINICAL GUARD: If signal is lost, start with flatline
      const rate = signalState === "LOST" ? 0 : initialRate;
      const initialBuffer = generateSyntheticWaveform(type, rate, 1000);
      bufferRef.current = initialBuffer;
      lastUpdateTimeRef.current = Date.now();
    }
  }, [type, initialRate, signalState]);

  const isFirstDataRef = useRef(true);
  
  // 📥 Ingest new data chunks into the circular buffer
  useEffect(() => {
    if (data.length > 0) {
      if (isReview) {
        // 🔄 INSTANT SYNC: In review mode, replace buffer to avoid "jump spikes"
        bufferRef.current = data;
        lastIndexRef.current = 0;
        scanPosRef.current = 0; // Reset sweep line to start
      } else {
        const isFirstPacket = bufferRef.current.length === 0;
        bufferRef.current = [...bufferRef.current, ...data].slice(-1200); 
        
        // 🔥 ZERO-LAG SYNC: If this is the first data arrival, jump to the end
        if (isFirstPacket) {
          lastIndexRef.current = Math.max(0, bufferRef.current.length - 200);
        }
      }
      lastUpdateTimeRef.current = Date.now();
    }
  }, [data, isReview]);

  // 🏥 INSTANT KILL: Wipe buffer if signal is lost
  useEffect(() => {
    if (signalState === "LOST") {
      bufferRef.current = new Array(200).fill(0);
      lastValRef.current = 0;
    }
  }, [signalState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Responsive sizing
    const width = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = h;

      const render = () => {
        const buffer = bufferRef.current;
        // 🏥 CLINICAL STATE DETECTION
        // We flatline if the state is explicitly OFFLINE or if the data has gone STALE
        const isOffline = state === "OFFLINE" || isStale;
        
        // If we are LIVE but have no data yet, wait for the first chunk
        if (!isOffline && buffer.length < 2) {
          animationRef.current = requestAnimationFrame(render);
          return;
        }
      
      // 🎛️ DYNAMIC ADAPTATION
      const isLost = signalState === "LOST";
      const baseSpeed = 3.33; 
      let multiplier = state === "DELAYED" || isLost ? 0.4 : 1.0;
      
      // Speed up slightly if buffer is getting full to catch up to real-time
      if (buffer.length > 800) multiplier *= 1.1; 
      if (buffer.length < 200 && !isOffline) multiplier *= 0.9; 

      let samplesPerFrame = baseSpeed * multiplier;
      const iterations = Math.max(2, Math.floor(samplesPerFrame));

      ctx.clearRect(scanPosRef.current, 0, 25, h);
      
      // 🏥 SIGNAL FADING logic
      ctx.globalAlpha = isLost ? 0.3 : 1.0;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      // 📺 CLINICAL CRT GLOW
      ctx.shadowBlur = 4;
      ctx.shadowColor = color;

      for (let i = 0; i < iterations; i++) {
        // 🛡️ STALENESS GUARD: If no new data in 2 seconds, force flatline (Disabled in Review Mode)
        const isStaleData = !isReview && (Date.now() - lastUpdateTimeRef.current) > 2000;
        
        // 🛡️ DATA SOURCE SELECTION
        const rawTarget = (isOffline || isStaleData) ? 0 : buffer[(lastIndexRef.current + i) % buffer.length];
        
        // 📉 SMOOTHING: Low-pass filter to prevent sharp vertical spikes during state changes
        const alpha = 0.2; // Smoothing factor
        const rawVal = lastValRef.current + alpha * (rawTarget - lastValRef.current);
        lastValRef.current = rawVal;
        
        const scale = type === "ECG" ? 0.35 : 0.45;
        const offset = type === "ECG" ? 0.5 : 0.6;
        
        const y = h - (rawVal * (h * scale) + (h * offset));
        
        if (i === 0) {
            ctx.moveTo(scanPosRef.current, y);
        } else {
            ctx.lineTo(scanPosRef.current, y);
        }
        
        scanPosRef.current = (scanPosRef.current + 1) % width;
        
        if (scanPosRef.current === 0) {
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, y);
        }
        ctx.clearRect(scanPosRef.current, 0, 6, h);
      }
      
      ctx.stroke();
      
      // Advance buffer index ONLY when we are actively showing spikes
      if (!isOffline && buffer.length > 0) {
        lastIndexRef.current = (lastIndexRef.current + Math.max(1, iterations - 1)) % buffer.length;
      }
      
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [color, type, state, isStale, signalState]);

  return (
    <div className="w-full relative h-full bg-transparent overflow-hidden">
      {/* 🏁 BACKGROUND GRID (Behind Waveform) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] grid grid-cols-12 grid-rows-6">
        {[...Array(72)].map((_, i) => (
          <div key={i} className="border-[0.1px] border-[#5C67F2]" />
        ))}
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full block relative z-10"
      />
    </div>
  );
}
