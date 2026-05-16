"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ChevronRight } from "lucide-react";

export const DocsHero = () => {
    return (
        <div className="relative overflow-hidden pt-32 pb-24 border-b border-zinc-100">
            {/* 📡 ANIMATED TELEMETRY BACKGROUND */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <svg className="absolute w-[200%] h-full opacity-[0.03]" viewBox="0 0 1000 100">
                    <motion.path
                        d="M0,50 L100,50 L110,20 L120,80 L130,50 L200,50 L210,30 L220,70 L230,50 L300,50 L310,10 L320,90 L330,50 L400,50 L410,20 L420,80 L430,50 L500,50 L510,30 L520,70 L530,50 L600,50 L610,10 L620,90 L630,50 L700,50 L710,20 L720,80 L730,50 L800,50 L810,30 L820,70 L830,50 L900,50 L910,10 L920,90 L930,50 L1000,50"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="1"
                        initial={{ pathOffset: 0 }}
                        animate={{ pathOffset: 1 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    />
                </svg>
            </div>

            <div className="container relative z-10 mx-auto px-6 max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col items-center text-center"
                >
                    <img src="/icon.png" alt="CareStream" className="w-20 h-20 mb-8 rounded-2xl shadow-xl border border-white/50" />

                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-8 border border-blue-100">
                        <ShieldCheck size={16} />
                        <span>Project Prototype Version</span>
                    </div>

                    <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-zinc-900 mb-8 max-w-4xl">
                        CareStream: <span className="text-blue-600">Health Monitoring Project</span>
                    </h1>

                    <p className="text-xl text-zinc-600 mb-12 max-w-2xl leading-relaxed">
                        A prototype project that shows how to monitor patient health in real-time.
                        It connects hardware sensors to a simple web dashboard for doctors and nurses.
                    </p>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' })}
                            className="h-12 px-8 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-all flex items-center gap-2 cursor-pointer"
                        >
                            Explore Architecture <ChevronRight size={18} />
                        </button>
                        <a 
                            href="https://github.com/sreenandpk/CareStream"
                            target="_blank"
                            className="h-12 px-8 bg-white border border-zinc-200 text-zinc-900 rounded-full font-medium hover:bg-zinc-50 transition-all flex items-center justify-center cursor-pointer"
                        >
                            GitHub Repository
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export const TechBadge = ({ label, category }: { label: string, category: string }) => {
    return (
        <div className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col gap-0.5 hover:border-blue-300 hover:bg-white transition-all cursor-default group">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold group-hover:text-blue-500">{category}</span>
            <span className="text-sm font-semibold text-zinc-800">{label}</span>
        </div>
    );
};
