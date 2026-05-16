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
                <DocsSection id="tech" title="Built With" icon={Layers}>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <TechBadge label="Next.js" category="Frontend" />
                        <TechBadge label="React" category="UI Library" />
                        <TechBadge label="Tailwind" category="Styling" />
                        <TechBadge label="Django" category="Backend" />
                        <TechBadge label="PostgreSQL" category="Database" />
                        <TechBadge label="Redis/Celery" category="Tasks" />
                        <TechBadge label="Scikit-Learn" category="AI Engine" />
                        <TechBadge label="WebSockets" category="Real-time" />
                    </div>
                </DocsSection>

                {/* 🚀 CORE CAPABILITIES */}
                <DocsSection id="capabilities" title="What it Can Do" icon={Zap}>
                    <div className="grid md:grid-cols-3 gap-8">
                        <DocsCard
                            title="Live Monitoring"
                            description="Shows heart rate and oxygen levels in real-time using simulated patient data."
                            icon={Activity}
                            delay={0.1}
                        />
                        <DocsCard
                            title="Smart Alerts"
                            description="Uses AI to automatically spot unusual health patterns and warn doctors immediately."
                            icon={Shield}
                            delay={0.2}
                        />
                        <DocsCard
                            title="Hospital Map"
                            description="Organizes patients into Wards, Rooms, and Beds for easy hospital management."
                            icon={Workflow}
                            delay={0.3}
                        />
                    </div>
                </DocsSection>

                {/* 🏗️ ARCHITECTURE */}
                <DocsSection id="architecture" title="Project Layout" icon={Workflow}>
                    <div className="space-y-8">
                        <div className="relative p-12 bg-blue-50/40 rounded-[3rem] overflow-hidden border border-blue-100/50 shadow-sm">
                            <div className="grid md:grid-cols-3 gap-12 relative z-10">
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-5 bg-white rounded-[2rem] text-blue-600 mb-6 border border-blue-100 shadow-sm">
                                        <Activity size={40} />
                                    </div>
                                    <h4 className="text-zinc-900 font-bold text-lg mb-2">Simulation</h4>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Generates fake but realistic health data for testing.</p>
                                </div>
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-5 bg-white rounded-[2rem] text-blue-600 mb-6 border border-blue-100 shadow-sm">
                                        <Cpu size={40} />
                                    </div>
                                    <h4 className="text-zinc-900 font-bold text-lg mb-2">AI Engine</h4>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Analyzes data to find patterns and hidden risks.</p>
                                </div>
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-5 bg-white rounded-[2rem] text-blue-600 mb-6 border border-blue-100 shadow-sm">
                                        <Database size={40} />
                                    </div>
                                    <h4 className="text-zinc-900 font-bold text-lg mb-2">Data Storage</h4>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Keeps all patient records and history safe.</p>
                                </div>
                            </div>
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-blue-200 to-transparent -translate-y-1/2 hidden md:block" />
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                                <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Zap className="text-blue-600" size={20} />
                                    Fast Notifications
                                </h4>
                                <p className="text-zinc-600 text-sm leading-relaxed">
                                    Uses "WebSockets" to send health updates to the screen without needing to refresh.
                                </p>
                            </div>
                            <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                                <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Terminal className="text-blue-600" size={20} />
                                    Task Workers
                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] rounded-full">Redis + Celery</span>
                                </h4>
                                <p className="text-zinc-600 text-sm leading-relaxed">
                                    Handles heavy data calculations in the background to keep the website smooth.
                                </p>
                            </div>
                        </div>
                    </div>
                </DocsSection>

                {/* 🛡️ SECURITY */}
                <DocsSection id="security" title="How We Keep it Safe" icon={Lock}>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-10 bg-white rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl transition-all group">
                            <Shield className="text-blue-600 mb-8 group-hover:scale-110 transition-transform" size={40} />
                            <h4 className="text-2xl font-bold mb-6">User Safety</h4>
                            <ul className="space-y-5 text-zinc-600">
                                <li className="flex items-center gap-4">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    Secure login with unique user accounts
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    Code verification for every login attempt
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    Different permissions for Doctors and Nurses
                                </li>
                            </ul>
                        </div>
                        <div className="p-10 bg-white rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl transition-all group">
                            <Terminal className="text-blue-600 mb-8 group-hover:scale-110 transition-transform" size={40} />
                            <h4 className="text-2xl font-bold mb-6">System Logs</h4>
                            <ul className="space-y-5 text-zinc-600">
                                <li className="flex items-center gap-4">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    We keep a list of all important actions taken
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    Safety checks to prevent hacking attempts
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    Automatic data backups and protection
                                </li>
                            </ul>
                        </div>
                    </div>
                </DocsSection>

                {/* 📥 TECHNICAL NARRATIVE */}
                <div className="mt-24 p-12 bg-zinc-900 rounded-[3rem] text-center">
                    <h3 className="text-3xl font-bold text-white mb-6">Project Guide</h3>
                    <p className="text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Read the full guide to see how to set up the project on your own computer and how the code works.
                    </p>
                    <a
                        href="https://github.com/sreenandpk/CareStream"
                        target="_blank"
                        className="inline-flex items-center gap-2 px-8 h-14 bg-white text-zinc-900 rounded-full font-black text-xs uppercase tracking-widest hover:bg-zinc-100 transition-all"
                    >
                        View Full Code
                    </a>
                </div>

            </div>
        </div>
    );
}
