"use client";

import { motion } from "framer-motion";
import {
    Activity,
    Shield,
    Cpu,
    Cloud,
    Database,
    Layers,
    Terminal,
    Lock,
    Fingerprint,
    Workflow,
    Zap,
    HeartPulse,
    ArrowRight
} from "lucide-react";
import { DocsHero, TechBadge } from "@/components/docs/DocsHero";
import { DocsSection, DocsCard } from "@/components/docs/DocsComponents";

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-zinc-900 selection:bg-blue-100 selection:text-blue-900">
            {/* 🧭 PREMIUM NAVIGATION */}
            <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-center pointer-events-none">
                <div className="glass-card px-6 py-3 rounded-full flex items-center gap-8 pointer-events-auto border-blue-100/50">
                    <div className="flex items-center gap-2 pr-6 border-r border-zinc-200">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                        <span className="text-sm font-bold tracking-tight">CARESTREAM NEXUS</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm font-medium text-zinc-500">
                        <a href="#tech" className="hover:text-blue-600 transition-colors">Stack</a>
                        <a href="#capabilities" className="hover:text-blue-600 transition-colors">Core</a>
                        <a href="#architecture" className="hover:text-blue-600 transition-colors">Engine</a>
                        <a href="#security" className="hover:text-blue-600 transition-colors">Lockdown</a>
                    </div>
                </div>
            </nav>

            {/* 🏥 HERO SECTION */}
            <DocsHero />

            <div className="container mx-auto px-6 max-w-6xl pb-32">

                {/* 🛠️ TECHNOLOGY STACK */}
                <DocsSection id="tech" title="The Engineering Stack" icon={Layers}>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <TechBadge label="Next.js 16+" category="Frontend" />
                        <TechBadge label="React 19" category="UI Library" />
                        <TechBadge label="Tailwind 4" category="Styling" />
                        <TechBadge label="Framer Motion" category="Animation" />
                        <TechBadge label="Zustand" category="State" />
                        <TechBadge label="Lucide" category="Icons" />

                        <TechBadge label="Django REST" category="Backend" />
                        <TechBadge label="PostgreSQL 16" category="Database" />
                        <TechBadge label="Redis" category="Cache/Broker" />
                        <TechBadge label="Celery" category="Tasks" />
                        <TechBadge label="Channels" category="WebSockets" />
                        <TechBadge label="Scikit-Learn" category="AI Engine" />
                    </div>
                </DocsSection>

                {/* 🚀 CORE CAPABILITIES */}
                <DocsSection id="capabilities" title="System Core Capabilities" icon={Zap}>
                    <div className="grid md:grid-cols-3 gap-8">
                        <DocsCard
                            title="Identity Shield"
                            description="Asynchronous email validation via SendGrid with real-time deliverability signals and automatic deactivation."
                            icon={Fingerprint}
                            delay={0.1}
                        />
                        <DocsCard
                            title="Real-Time Telemetry"
                            description="High-fidelity vitals ingestion from physical ESP32 sensors or software simulations with sub-second latency."
                            icon={Activity}
                            delay={0.2}
                        />
                        <DocsCard
                            title="AI Forensics"
                            description="Scikit-learn driven pattern detection and Review Replay for deep forensic playback of patient telemetry history."
                            icon={HeartPulse}
                            delay={0.3}
                        />
                    </div>
                </DocsSection>

                {/* 🏗️ ARCHITECTURE */}
                <DocsSection id="architecture" title="The Production Nexus" icon={Workflow}>
                    <div className="relative p-12 bg-blue-50/40 rounded-[3rem] overflow-hidden border border-blue-100/50 shadow-sm">
                        {/* 📊 ARCHITECTURE FLOW VISUALIZATION */}
                        <div className="grid md:grid-cols-3 gap-12 relative z-10">
                            <div className="flex flex-col items-center text-center">
                                <div className="p-5 bg-white rounded-[2rem] text-blue-600 mb-6 border border-blue-100 shadow-sm">
                                    <Cloud size={40} />
                                </div>
                                <h4 className="text-zinc-900 font-bold text-lg mb-2">Vercel Edge</h4>
                                <p className="text-zinc-500 text-sm leading-relaxed">Next.js 16+ Application<br />Global Delivery Network</p>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <div className="p-5 bg-white rounded-[2rem] text-blue-600 mb-6 border border-blue-100 shadow-sm">
                                    <Cpu size={40} />
                                </div>
                                <h4 className="text-zinc-900 font-bold text-lg mb-2">AWS ECS Cluster</h4>
                                <p className="text-zinc-500 text-sm leading-relaxed">Django REST Engine<br />Celery Workers & Task Queue</p>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <div className="p-5 bg-white rounded-[2rem] text-blue-600 mb-6 border border-blue-100 shadow-sm">
                                    <Database size={40} />
                                </div>
                                <h4 className="text-zinc-900 font-bold text-lg mb-2">Postgres & Redis</h4>
                                <p className="text-zinc-500 text-sm leading-relaxed">PostgreSQL 16 Storage<br />Redis Cache & Signaling</p>
                            </div>
                        </div>
                        {/* Connecting line */}
                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-blue-200 to-transparent -translate-y-1/2 hidden md:block" />
                    </div>
                </DocsSection>

                {/* 🛡️ SECURITY */}
                <DocsSection id="security" title="Enterprise Security Protocols" icon={Lock}>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-10 bg-white rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl transition-all group">
                            <Shield className="text-blue-600 mb-8 group-hover:scale-110 transition-transform" size={40} />
                            <h4 className="text-2xl font-bold mb-6">Identity Integrity Nexus</h4>
                            <ul className="space-y-5 text-zinc-600">
                                <li className="flex items-center gap-4">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    Stateless JWT Authentication with Secure Handshakes
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    Mandatory 6-digit OTP Identity Verification
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    Strict RBAC (Admin, Doctor, Nurse) Segregation
                                </li>
                            </ul>
                        </div>
                        <div className="p-10 bg-white rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl transition-all group">
                            <Terminal className="text-blue-600 mb-8 group-hover:scale-110 transition-transform" size={40} />
                            <h4 className="text-2xl font-bold mb-6">Audit & Forensic Logging</h4>
                            <ul className="space-y-5 text-zinc-600">
                                <li className="flex items-center gap-4">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    High-Frequency System Audit Trails (File + WS)
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    IP-Based Rate Limiting & Identity Buffering
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    Secure Production Cookie Synchronization
                                </li>
                            </ul>
                        </div>
                    </div>
                </DocsSection>

                {/* 📥 TECHNICAL NARRATIVE */}
                <div className="mt-24 p-12 bg-zinc-900 rounded-[3rem] text-center">
                    <h3 className="text-3xl font-bold text-white mb-6">Full Project Guide</h3>
                    <p className="text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Access the comprehensive technical narrative, including localized environment setup,
                        asynchronous deliverability logic, and forensic playback specifications.
                    </p>
                    <a
                        href="https://github.com/sreenandpk/CareStream/blob/main/PROJECT_GUIDE.md"
                        target="_blank"
                        className="inline-flex items-center gap-2 px-8 h-14 bg-white text-zinc-900 rounded-full font-black text-xs uppercase tracking-widest hover:bg-zinc-100 transition-all"
                    >
                        View Raw Specifications
                    </a>
                </div>

            </div>
        </div>
    );
}
