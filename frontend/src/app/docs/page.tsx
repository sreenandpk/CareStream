"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
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
    ChevronRight,
    Menu,
    X
} from "lucide-react";
import { DocsHero, TechBadge } from "@/components/docs/DocsHero";
import { DocsSection, DocsCard } from "@/components/docs/DocsComponents";

export default function DocsPage() {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white text-zinc-900 selection:bg-blue-100 selection:text-blue-700">
            {/* 🧭 MODERN NAV */}
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[min(90%,1100px)]">
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-full px-6 py-3 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Shield className="text-white w-4 h-4" />
                        </div>
                        <span className="font-black tracking-tighter text-lg uppercase">
                            Care<span className="text-blue-600">Stream</span>
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                        <a href="#tech" className="hover:text-blue-600 transition-colors">Built With</a>
                        <a href="#clinical" className="hover:text-blue-600 transition-colors">What it Does</a>
                        <a href="#architecture" className="hover:text-blue-600 transition-colors">How it Works</a>
                        <a href="#identity" className="hover:text-blue-600 transition-colors">Safety</a>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => router.push("/login")}
                            className="hidden sm:flex items-center gap-2 px-5 py-2 bg-zinc-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95"
                        >
                            Sign In
                        </button>
                        
                        {/* Mobile Toggle */}
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 text-zinc-500 hover:text-blue-600 transition-colors"
                        >
                            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </motion.div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-20 left-0 w-full p-4 md:hidden"
                        >
                            <div className="bg-white rounded-3xl border border-zinc-100 shadow-2xl p-6 flex flex-col gap-4">
                                {[
                                    { name: "Built With", href: "#tech" },
                                    { name: "What it Does", href: "#clinical" },
                                    { name: "How it Works", href: "#architecture" },
                                    { name: "Safety", href: "#identity" }
                                ].map((item) => (
                                    <a 
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-sm font-bold text-zinc-500 hover:text-blue-600 py-2 border-b border-zinc-50 last:border-0"
                                    >
                                        {item.name}
                                    </a>
                                ))}
                                <button 
                                    onClick={() => router.push("/login")}
                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[12px] font-bold uppercase tracking-widest mt-2"
                                >
                                    Sign In
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* 🚀 HERO SECTION */}
            <DocsHero />

            <div className="container mx-auto px-4 md:px-6 max-w-6xl pb-32">
                {/* 🛠️ TECHNOLOGY STACK */}
                <DocsSection id="tech" title="Built With" icon={Layers}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-12">
                        <TechBadge label="Next.js 16" category="Frontend" />
                        <TechBadge label="React 19" category="UI Library" />
                        <TechBadge label="Tailwind 4" category="Styling" />
                        <TechBadge label="Django REST" category="Backend" />
                        <TechBadge label="PostgreSQL 16" category="Database" />
                        <TechBadge label="Redis 7" category="Real-time" />
                        <TechBadge label="Celery" category="Task Queue" />
                        <TechBadge label="WebSockets" category="Streaming" />
                        <TechBadge label="Scikit-Learn" category="AI Engine" />
                        <TechBadge label="AWS ECS" category="Deployment" />
                        <TechBadge label="AWS RDS" category="Cloud DB" />
                        <TechBadge label="Vercel" category="Hosting" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                        <div className="p-6 md:p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
                            <h4 className="text-lg font-bold mb-4">Why these tools?</h4>
                            <div className="space-y-4 text-sm text-zinc-600 leading-relaxed">
                                <p>
                                    <strong>Next.js & React:</strong> We use these to make the website super fast and smooth, so doctors don't have to wait.
                                </p>
                                <p>
                                    <strong>Django & Python:</strong> The "Brain" of the project. It handles all the patient records and security safely.
                                </p>
                                <p>
                                    <strong>AWS Cloud:</strong> We use Amazon's professional servers (ECS & RDS) to keep the data safe and always online.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 md:p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
                            <h4 className="text-lg font-bold mb-4">The Strategy</h4>
                            <div className="space-y-4 text-sm text-zinc-600 leading-relaxed">
                                <p>
                                    <strong>Real-Time Data:</strong> We use "WebSockets" to show heart rates instantly without needing to refresh the page.
                                </p>
                                <p>
                                    <strong>Managed Safety:</strong> By using AWS RDS, we ensure patient data is automatically backed up and encrypted.
                                </p>
                                <p>
                                    <strong>Smart Alerts:</strong> The system uses AI (Scikit-Learn) to spot health risks before they become emergencies.
                                </p>
                            </div>
                        </div>
                    </div>
                </DocsSection>

                {/* 🛡️ SAFETY */}
                <DocsSection id="identity" title="Safety & Security" icon={Shield}>
                    <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                        <div className="p-8 md:p-10 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                            <h4 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-3">
                                <Fingerprint className="text-blue-600" />
                                Account Guard
                            </h4>
                            <p className="text-zinc-600 mb-6 text-sm md:text-base leading-relaxed">
                                When someone signs up, the system automatically checks if their email is real. If it's a fake email, 
                                the account is locked instantly to keep the platform safe.
                            </p>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Automatic Verification</span>
                            </div>
                        </div>
                        <div className="p-8 md:p-10 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                            <h4 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-3">
                                <Lock className="text-blue-600" />
                                Login Security
                            </h4>
                            <ul className="space-y-4 text-zinc-600 text-sm">
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                                    6-digit code sent to your email for login
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                                    Strict roles for Admins, Doctors, and Nurses
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                                    Locked sessions to prevent unauthorized access
                                </li>
                            </ul>
                        </div>
                    </div>
                </DocsSection>

                {/* 📡 WHAT IT DOES */}
                <DocsSection id="clinical" title="What it Does" icon={Activity}>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
                        <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                            <h4 className="text-xl font-bold mb-4">Live Monitoring</h4>
                            <p className="text-zinc-500 text-sm leading-relaxed">
                                Connects to <strong>ESP32</strong> devices to show real patient heart rates and oxygen levels on the screen.
                            </p>
                        </div>
                        <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                            <h4 className="text-xl font-bold mb-4">Simulated Data</h4>
                            <p className="text-zinc-500 text-sm leading-relaxed">
                                Can also create "Fake Data" so doctors can practice using the system without needing a real patient.
                            </p>
                        </div>
                        <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                            <h4 className="text-xl font-bold mb-4">Smart History</h4>
                            <p className="text-zinc-500 text-sm leading-relaxed">
                                Stores every heartbeat so doctors can go back in time and see what happened during a crisis.
                            </p>
                        </div>
                    </div>

                    <div className="p-8 md:p-10 bg-white rounded-3xl border border-zinc-100 shadow-sm group">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-50 rounded-2xl">
                                <Cpu className="text-blue-600" size={28} />
                            </div>
                            <h4 className="text-2xl font-bold">The Hardware</h4>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                            <div className="space-y-2">
                                <h5 className="font-bold text-zinc-900">MAX30102 Sensor</h5>
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                    A professional sensor that clips onto a finger to read heart rate and oxygen levels.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h5 className="font-bold text-zinc-900">ESP32 Device</h5>
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                    The "Mini Computer" that takes the sensor data and sends it to our website using Wi-Fi.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h5 className="font-bold text-zinc-900">Jumper Wires</h5>
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                    Simple wires that connect the sensor to the device to share data.
                                </p>
                            </div>
                        </div>
                    </div>
                </DocsSection>

                {/* 🤖 SMART FEATURES */}
                <DocsSection id="forensics" title="Smart Features" icon={HeartPulse}>
                    <div className="relative p-8 md:p-12 bg-zinc-950 rounded-[3rem] overflow-hidden border border-zinc-800 text-white shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-50" />
                        <div className="relative z-10 grid md:grid-cols-2 gap-10 md:gap-12">
                            <div>
                                <h4 className="text-2xl font-bold mb-6">Review Replay</h4>
                                <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-8">
                                    Doctors can "Rewind" a patient's data. It plays back their vitals exactly as they happened, 
                                    helping find what went wrong.
                                </p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-bold border border-blue-500/20 uppercase tracking-widest">
                                    Playback System
                                </div>
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold mb-6">AI Health Check</h4>
                                <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-8">
                                    Uses "Isolation Forest" AI to look for patterns. It automatically flags weird heart rates 
                                    that a human might miss.
                                </p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/20 uppercase tracking-widest">
                                    Smart Alerts
                                </div>
                            </div>
                        </div>
                    </div>
                </DocsSection>

                {/* 🏗️ HOW IT WORKS */}
                <DocsSection id="architecture" title="How it Works" icon={Workflow}>
                    <div className="space-y-8">
                        {/* 🔄 DATA FLOW STEPS */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { step: "01", title: "Read", desc: "The sensor reads the heartbeat." },
                                { step: "02", title: "Think", desc: "The AI checks if it's normal." },
                                { step: "03", title: "Send", desc: "Sent instantly to the screen." },
                                { step: "04", title: "Save", desc: "Saved in the secure cloud." }
                            ].map((item, i) => (
                                <div key={i} className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 relative group hover:border-blue-200 transition-all">
                                    <span className="text-[32px] md:text-[40px] font-black text-blue-600/10 absolute top-2 right-4 group-hover:text-blue-600/20">{item.step}</span>
                                    <h5 className="font-bold mb-2 text-zinc-900">{item.title}</h5>
                                    <p className="text-[11px] text-zinc-500 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="relative p-8 md:p-12 bg-blue-50/40 rounded-[3rem] overflow-hidden border border-blue-100/50 shadow-sm">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12 relative z-10">
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-5 bg-white rounded-[2rem] text-blue-600 mb-6 border border-blue-100 shadow-sm">
                                        <Cloud size={32} />
                                    </div>
                                    <h4 className="text-zinc-900 font-bold text-lg mb-2">Vercel</h4>
                                    <p className="text-zinc-500 text-[13px] leading-relaxed">Where the website lives.</p>
                                </div>
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-5 bg-white rounded-[2rem] text-blue-600 mb-6 border border-blue-100 shadow-sm">
                                        <Cpu size={32} />
                                    </div>
                                    <h4 className="text-zinc-900 font-bold text-lg mb-2">AWS Servers</h4>
                                    <p className="text-zinc-500 text-[13px] leading-relaxed">The engine behind the scenes.</p>
                                </div>
                                <div className="flex flex-col items-center text-center sm:col-span-2 lg:col-span-1">
                                    <div className="p-5 bg-white rounded-[2rem] text-blue-600 mb-6 border border-blue-100 shadow-sm">
                                        <Shield size={32} />
                                    </div>
                                    <h4 className="text-zinc-900 font-bold text-lg mb-2">Security</h4>
                                    <p className="text-zinc-500 text-[13px] leading-relaxed">Keeps everything safe.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 md:p-10 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                            <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Terminal className="text-blue-600" size={20} />
                                Technical Links
                            </h4>
                            <div className="grid sm:grid-cols-2 gap-6 md:gap-8 text-sm text-zinc-500">
                                <div className="space-y-1">
                                    <span className="font-bold text-zinc-900">Frontend:</span>
                                    <div className="bg-white px-3 py-2 rounded-xl border border-zinc-200 font-mono text-[11px] truncate">care-stream.vercel.app</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="font-bold text-zinc-900">Backend API:</span>
                                    <div className="bg-white px-3 py-2 rounded-xl border border-zinc-200 font-mono text-[11px] truncate">carestream-cloud.duckdns.org</div>
                                </div>
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
