"use client";

import React, { useEffect, useRef } from "react";

interface VitalWaveformProps {
  data: number[]; // 🚨 PRODUCTION: Incoming data chunks from WebSocket
  color: string;
  type: "ECG" | "PPG";
  height?: number;
  initialRate?: number; // Added to bootstrap the wave instantly
  state?: "LIVE" | "DELAYED" | "OFFLINE";
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
  state = "LIVE"
}: VitalWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<number[]>([]);
  const lastIndexRef = useRef(0);
  const animationRef = useRef<number>(0);

  // 📥 BOOTSTRAP: Fill initial buffer to prevent "blank" start
  useEffect(() => {
    if (bufferRef.current.length === 0) {
      // 🏥 PATIENT SAFETY: Generate 200 points of flat baseline to start the sweep immediately
      // This ensures the grid is never blank while waiting for the first history/socket chunk.
      const startSamples = type === "ECG" ? new Array(200).fill(0) : new Array(200).fill(0.2);
      bufferRef.current = startSamples;
    }
  }, [type]);

  const isFirstDataRef = useRef(true);
  
  // 📥 Ingest new data chunks into the circular buffer
  useEffect(() => {
    if (data.length > 0) {
      // 🚀 CONTINUITY ENGINE: Append new buffer to internal stream immediately
      // Increased slice to 1200 (approx 12s of history) for smoother clinical transition
      bufferRef.current = [...bufferRef.current, ...data].slice(-1200); 
    }
  }, [data]);

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

    let scanPos = 0;
    
    // 🎛️ Velocity Controller
    let samplesPerFrame = type === "ECG" ? 1.6 : 1.3;

    const render = () => {
      const buffer = bufferRef.current;
      
      // 🧘 BASELINE MODE: Only show flatline if we truly have NO data
      const isShowingBaseline = buffer.length < 5;
      
      // 🏎️ DYNAMIC ADAPTATION
      const baseSpeed = type === "ECG" ? 1.6 : 1.3;
      let multiplier = state === "DELAYED" ? 0.4 : 1.0;
      
      if (buffer.length > 1200) multiplier *= 1.2; 
      if (buffer.length < 300 && state === "LIVE") multiplier *= 0.95; 

      samplesPerFrame = baseSpeed * multiplier;

      ctx.clearRect(scanPos, 0, 20, h);

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";

      for (let i = 0; i < samplesPerFrame; i++) {
        const val = isShowingBaseline 
          ? (type === "ECG" ? 0 : 0.2) 
          : buffer[(lastIndexRef.current + i) % buffer.length];
        
        const scale = type === "ECG" ? 0.4 : 0.5;
        const offset = type === "ECG" ? 0.5 : 0.7;
        const y = h - (val * h * scale + h * offset);
        
        if (i === 0) {
            ctx.moveTo(scanPos, y);
        } else {
            ctx.lineTo(scanPos, y);
        }
        
        scanPos = (scanPos + 1) % width;
        
        if (scanPos === 0) {
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, y);
        }

        ctx.clearRect(scanPos, 0, 6, h);
      }
      
      ctx.stroke();
      lastIndexRef.current = (lastIndexRef.current + Math.floor(samplesPerFrame)) % buffer.length;
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [color, type]);

  return (
    <div className="w-full relative h-full bg-transparent overflow-hidden">
      {/* 🏁 BACKGROUND GRID (Behind Waveform) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.08] grid grid-cols-12 grid-rows-6">
        {[...Array(72)].map((_, i) => (
          <div key={i} className="border-[0.2px] border-white/20" />
        ))}
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full block relative z-10"
      />
    </div>
  );
}
