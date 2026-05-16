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
    ChevronRight
} from "lucide-react";
import { DocsHero, TechBadge } from "@/components/docs/DocsHero";
import { DocsSection, DocsCard } from "@/components/docs/DocsComponents";

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-zinc-900 selection:bg-blue-100 selection:text-blue-900">
            {/* 🧭 SIMPLE NAVIGATION */}
            <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-center pointer-events-none">
                <div className="glass-card px-6 py-3 rounded-full flex items-center gap-8 pointer-events-auto border-blue-100/50">
                    <div className="flex items-center gap-2 pr-6 border-r border-zinc-200">
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        <span className="text-sm font-bold tracking-tight uppercase">Project Guide</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm font-medium text-zinc-500">
                        <a href="#tech" className="hover:text-blue-600 transition-colors">Tools</a>
                        <a href="#capabilities" className="hover:text-blue-600 transition-colors">Features</a>
                        <a href="#architecture" className="hover:text-blue-600 transition-colors">Layout</a>
                        <a href="#security" className="hover:text-blue-600 transition-colors">Safety</a>
                    </div>
                </div>
            </nav>

            {/* 🏥 HERO SECTION */}
            <DocsHero />

            <div className="container mx-auto px-6 max-w-6xl pb-32">

                {/* 🛠️ TECHNOLOGY STACK */}
                <DocsSection id="tech" title="The Engineering Stack" icon={Layers}>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
                        <TechBadge label="Next.js 16" category="Frontend" />
                        <TechBadge label="React 19" category="UI Library" />
                        <TechBadge label="Tailwind 4" category="Styling" />
                        <TechBadge label="Django REST" category="Backend" />
                        <TechBadge label="PostgreSQL 16" category="Database" />
                        <TechBadge label="Redis 7" category="Real-time" />
                        <TechBadge label="Celery" category="Task Queue" />
                        <TechBadge label="WebSockets" category="Streaming" />
                        <TechBadge label="Scikit-Learn" category="AI Engine" />
                        <TechBadge label="AWS RDS" category="Database" />
                        <TechBadge label="AWS S3" category="Storage" />
                        <TechBadge label="AWS ECR" category="Registry" />
                        <TechBadge label="AWS ElastiCache" category="Real-time" />
                        <TechBadge label="AWS ECS" category="Compute" />
                        <TechBadge label="Vercel" category="Hosting" />
                        <TechBadge label="DuckDNS" category="Gateway" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
                            <h4 className="text-lg font-bold mb-4">Cloud Infrastructure (AWS)</h4>
                            <div className="space-y-4 text-sm text-zinc-600 leading-relaxed">
                                <p>
                                    <strong>AWS RDS (Postgres):</strong> We use managed RDS for our medical records to ensure automatic backups, high availability, and data encryption at rest.
                                </p>
                                <p>
                                    <strong>AWS S3:</strong> Secure storage for clinical documents, medical images, and project assets, ensuring they are always available and protected.
                                </p>
                                <p>
                                    <strong>AWS ElastiCache (Redis):</strong> Powers our live telemetry signaling with sub-millisecond latency, essential for real-time crisis monitoring.
                                </p>
                            </div>
                        </div>
                        <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
                            <h4 className="text-lg font-bold mb-4">Deployment Strategy</h4>
                            <div className="space-y-4 text-sm text-zinc-600 leading-relaxed">
                                <p>
                                    <strong>AWS ECR:</strong> Our private container registry for storing production-ready Docker images, ensuring secure and fast deployments to the ECS cluster.
                                </p>
                                <p>
                                    <strong>AWS ECS (Fargate):</strong> Provides a scalable, high-performance container environment for our Django Engine, handling both API traffic and secure WebSocket tunnels.
                                </p>
                                <p>
                                    <strong>Vercel Edge:</strong> Delivers our Next.js frontend globally with minimal latency, ensuring the dashboard is always responsive for medical staff.
                                </p>
                            </div>
                        </div>
                    </div>
                </DocsSection>

                {/* 🛡️ IDENTITY SHIELD */}
                <DocsSection id="identity" title="Identity Shield & Security" icon={Shield}>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-10 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                            <h4 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Fingerprint className="text-blue-600" />
                                Smart Account Guard
                            </h4>
                            <p className="text-zinc-600 mb-6 leading-relaxed">
                                When a user is created, our <strong>Identity Shield</strong> task runs in the background. It checks 
                                for email delivery signals. If an email is fake, the account is automatically locked.
                            </p>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Asynchronous Validation</span>
                            </div>
                        </div>
                        <div className="p-10 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                            <h4 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Lock className="text-blue-600" />
                                Lockdown Protocol
                            </h4>
                            <ul className="space-y-4 text-zinc-600 text-sm">
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                    Mandatory 6-digit Email OTP for login
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                    Strict Role-Based Access (Admin/Doctor/Nurse)
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                    JWT-based stateless session management
                                </li>
                            </ul>
                        </div>
                    </div>
                </DocsSection>

                {/* 📡 CLINICAL NEXUS */}
                <DocsSection id="clinical" title="Clinical Monitoring Nexus" icon={Activity}>
                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                            <h4 className="text-xl font-bold mb-4">Hardware Edge</h4>
                            <p className="text-zinc-500 text-sm leading-relaxed">
                                Native support for <strong>ESP32</strong> devices to send real patient vitals over secure 
                                data tunnels.
                            </p>
                        </div>
                        <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                            <h4 className="text-xl font-bold mb-4">Live Waveforms</h4>
                            <p className="text-zinc-500 text-sm leading-relaxed">
                                High-fidelity real-time streaming of Heart Rate and SpO2 using secure WebSockets.
                            </p>
                        </div>
                        <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                            <h4 className="text-xl font-bold mb-4">Dual Mode</h4>
                            <p className="text-zinc-500 text-sm leading-relaxed">
                                Seamlessly switch between <strong>Simulation Mode</strong> and <strong>Real Device Mode</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="p-10 bg-white rounded-3xl border border-zinc-100 shadow-sm group">
                        <div className="flex items-center gap-4 mb-8">
                            <Cpu className="text-blue-600" size={32} />
                            <h4 className="text-2xl font-bold">Hardware Assembly</h4>
                        </div>
                        <div className="grid md:grid-cols-3 gap-12">
                            <div>
                                <h5 className="font-bold text-zinc-900 mb-2">MAX30102 Sensor</h5>
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                    High-accuracy pulse oximeter and heart-rate sensor used to capture clinical-grade patient vitals.
                                </p>
                            </div>
                            <div>
                                <h5 className="font-bold text-zinc-900 mb-2">ESP32 Brain</h5>
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                    The "Hardware Brain" that reads sensor data and sends it directly to our cloud via secure WebSockets.
                                </p>
                            </div>
                            <div>
                                <h5 className="font-bold text-zinc-900 mb-2">I2C Jumper Logic</h5>
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                    Uses standard jumper wires to establish I2C communication between the sensor and the microcontroller.
                                </p>
                            </div>
                        </div>
                    </div>
                </DocsSection>

                {/* 🤖 AI & FORENSICS */}
                <DocsSection id="forensics" title="AI Forensics & Playback" icon={HeartPulse}>
                    <div className="relative p-12 bg-zinc-950 rounded-[3rem] overflow-hidden border border-zinc-800 text-white shadow-2xl">
                        <div className="absolute inset-0 bg-linear-to-b from-blue-500/10 to-transparent opacity-50" />
                        <div className="relative z-10 grid md:grid-cols-2 gap-12">
                            <div>
                                <h4 className="text-2xl font-bold mb-6">Review Replay</h4>
                                <p className="text-zinc-400 leading-relaxed mb-8">
                                    Doctors can access full forensic playback of patient telemetry sessions. Watch 
                                    historical vitals as they happened in real-time for deeper medical review.
                                </p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold border border-blue-500/20">
                                    Pattern Detection Enabled
                                </div>
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold mb-6">AI Pattern Intelligence</h4>
                                <p className="text-zinc-400 leading-relaxed mb-8">
                                    Uses <strong>Isolation Forest</strong> (Scikit-Learn) to automatically flag unusual health 
                                    events that medical staff might miss during busy shifts.
                                </p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                                    99% Detection Sensitivity
                                </div>
                            </div>
                        </div>
                    </div>
                </DocsSection>

                {/* 🏗️ ARCHITECTURE */}
                <DocsSection id="architecture" title="System Design & Data Flow" icon={Workflow}>
                    <div className="space-y-8">
                        {/* 🔄 DATA FLOW STEPS */}
                        <div className="grid md:grid-cols-4 gap-4">
                            {[
                                { step: "01", title: "Ingestion", desc: "Sensors or Sims send raw vitals to our secure gateway." },
                                { step: "02", title: "Analysis", desc: "AI Engine checks for anomalies using Isolation Forest." },
                                { step: "03", title: "Signaling", desc: "Redis Pub/Sub broadcasts data via WebSockets." },
                                { step: "04", title: "Persistence", desc: "Postgres stores the history for future playback." }
                            ].map((item, i) => (
                                <div key={i} className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 relative group hover:border-blue-200 transition-all">
                                    <span className="text-[40px] font-black text-blue-600/10 absolute top-2 right-4 group-hover:text-blue-600/20">{item.step}</span>
                                    <h5 className="font-bold mb-2 text-zinc-900">{item.title}</h5>
                                    <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="relative p-12 bg-blue-50/40 rounded-[3rem] overflow-hidden border border-blue-100/50 shadow-sm">
                            <div className="grid md:grid-cols-3 gap-12 relative z-10">
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-5 bg-white rounded-[2rem] text-blue-600 mb-6 border border-blue-100 shadow-sm">
                                        <Cloud size={40} />
                                    </div>
                                    <h4 className="text-zinc-900 font-bold text-lg mb-2">Vercel (UI)</h4>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Global frontend hosting with Edge logic.</p>
                                </div>
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-5 bg-white rounded-[2rem] text-blue-600 mb-6 border border-blue-100 shadow-sm">
                                        <Cpu size={40} />
                                    </div>
                                    <h4 className="text-zinc-900 font-bold text-lg mb-2">AWS ECS (Engine)</h4>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Dockerized backend running on the cloud.</p>
                                </div>
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-5 bg-white rounded-[2rem] text-blue-600 mb-6 border border-blue-100 shadow-sm">
                                        <Shield size={40} />
                                    </div>
                                    <h4 className="text-zinc-900 font-bold text-lg mb-2">DuckDNS + SSL</h4>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Secure gateway with automatic SSL padlocks.</p>
                                </div>
                            </div>
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-blue-200 to-transparent -translate-y-1/2 hidden md:block" />
                        </div>

                        <div className="p-10 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                            <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Terminal className="text-blue-600" size={20} />
                                Production Pipeline
                            </h4>
                            <div className="grid md:grid-cols-2 gap-8 text-sm text-zinc-500 leading-relaxed">
                                <p><strong>Frontend:</strong> Hosted at <code className="bg-white px-2 py-1 rounded">care-stream.vercel.app</code></p>
                                <p><strong>Backend API:</strong> Hosted at <code className="bg-white px-2 py-1 rounded">carestream-cloud.duckdns.org</code></p>
                            </div>
                        </div>
                    </div>
                </DocsSection>

                {/* 📥 TECHNICAL NARRATIVE */}
                <div className="mt-24 p-12 bg-zinc-900 rounded-[3rem] text-center">
                    <h3 className="text-3xl font-bold text-white mb-6">Complete Project Guide</h3>
                    <p className="text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Read the full technical guide to see the code architecture, ward management logic, and cloud setup details.
                    </p>
                    <a
                        href="https://github.com/sreenandpk/CareStream"
                        target="_blank"
                        className="inline-flex items-center gap-2 px-8 h-14 bg-white text-zinc-900 rounded-full font-black text-xs uppercase tracking-widest hover:bg-zinc-100 transition-all"
                    >
                        Explore Repository
                    </a>
                </div>

            </div>
        </div>
    );
}
