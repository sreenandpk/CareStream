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
                        <a href="#clinical" className="hover:text-blue-600 transition-colors">Features</a>
                        <a href="#architecture" className="hover:text-blue-600 transition-colors">Layout</a>
                        <a href="#identity" className="hover:text-blue-600 transition-colors">Safety</a>
                    </div>
                </div>
            </nav>

            {/* 🏥 HERO SECTION */}
            <DocsHero />

            <div className="container mx-auto px-6 max-w-6xl pb-32">

                {/* 🛠️ TECHNOLOGY STACK */}
                <DocsSection id="tech" title="Built With" icon={Layers}>
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
                        <TechBadge label="AWS ECS" category="Deployment" />
                        <TechBadge label="AWS RDS" category="Cloud DB" />
                        <TechBadge label="Vercel" category="Hosting" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
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
                        <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
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
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-10 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                            <h4 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Fingerprint className="text-blue-600" />
                                Account Guard
                            </h4>
                            <p className="text-zinc-600 mb-6 leading-relaxed">
                                When someone signs up, the system automatically checks if their email is real. If it's a fake email, 
                                the account is locked instantly to keep the platform safe.
                            </p>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Automatic Verification</span>
                            </div>
                        </div>
                        <div className="p-10 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                            <h4 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Lock className="text-blue-600" />
                                Login Security
                            </h4>
                            <ul className="space-y-4 text-zinc-600 text-sm">
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                    6-digit code sent to your email for login
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                    Strict roles for Admins, Doctors, and Nurses
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                    Locked sessions to prevent unauthorized access
                                </li>
                            </ul>
                        </div>
                    </div>
                </DocsSection>

                {/* 📡 WHAT IT DOES */}
                <DocsSection id="clinical" title="What it Does" icon={Activity}>
                    <div className="grid md:grid-cols-3 gap-8 mb-12">
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

                    <div className="p-10 bg-white rounded-3xl border border-zinc-100 shadow-sm group">
                        <div className="flex items-center gap-4 mb-8">
                            <Cpu className="text-blue-600" size={32} />
                            <h4 className="text-2xl font-bold">The Hardware</h4>
                        </div>
                        <div className="grid md:grid-cols-3 gap-12">
                            <div>
                                <h5 className="font-bold text-zinc-900 mb-2">MAX30102 Sensor</h5>
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                    A professional sensor that clips onto a finger to read heart rate and oxygen levels.
                                </p>
                            </div>
                            <div>
                                <h5 className="font-bold text-zinc-900 mb-2">ESP32 Device</h5>
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                    The "Mini Computer" that takes the sensor data and sends it to our website using Wi-Fi.
                                </p>
                            </div>
                            <div>
                                <h5 className="font-bold text-zinc-900 mb-2">Jumper Wires</h5>
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                    Simple wires that connect the sensor to the device to share data.
                                </p>
                            </div>
                        </div>
                    </div>
                </DocsSection>

                {/* 🤖 SMART FEATURES */}
                <DocsSection id="forensics" title="Smart Features" icon={HeartPulse}>
                    <div className="relative p-12 bg-zinc-950 rounded-[3rem] overflow-hidden border border-zinc-800 text-white shadow-2xl">
                        <div className="absolute inset-0 bg-linear-to-b from-blue-500/10 to-transparent opacity-50" />
                        <div className="relative z-10 grid md:grid-cols-2 gap-12">
                            <div>
                                <h4 className="text-2xl font-bold mb-6">Review Replay</h4>
                                <p className="text-zinc-400 leading-relaxed mb-8">
                                    Doctors can "Rewind" a patient's data. It plays back their vitals exactly as they happened, 
                                    helping find what went wrong.
                                </p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold border border-blue-500/20">
                                    Playback System
                                </div>
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold mb-6">AI Health Check</h4>
                                <p className="text-zinc-400 leading-relaxed mb-8">
                                    Uses "Isolation Forest" AI to look for patterns. It automatically flags weird heart rates 
                                    that a human might miss.
                                </p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
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
                        <div className="grid md:grid-cols-4 gap-4">
                            {[
                                { step: "01", title: "Read", desc: "The sensor reads the patient's heartbeat." },
                                { step: "02", title: "Think", desc: "The AI checks if the heartbeat is normal." },
                                { step: "03", title: "Send", desc: "The data is sent instantly to the nurse's screen." },
                                { step: "04", title: "Save", desc: "Everything is saved in a secure cloud database." }
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
                                    <h4 className="text-zinc-900 font-bold text-lg mb-2">Vercel</h4>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Where the website lives.</p>
                                </div>
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-5 bg-white rounded-[2rem] text-blue-600 mb-6 border border-blue-100 shadow-sm">
                                        <Cpu size={40} />
                                    </div>
                                    <h4 className="text-zinc-900 font-bold text-lg mb-2">AWS Servers</h4>
                                    <p className="text-zinc-500 text-sm leading-relaxed">The professional engine behind the scenes.</p>
                                </div>
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-5 bg-white rounded-[2rem] text-blue-600 mb-6 border border-blue-100 shadow-sm">
                                        <Shield size={40} />
                                    </div>
                                    <h4 className="text-zinc-900 font-bold text-lg mb-2">Security</h4>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Keeps everything safe and private.</p>
                                </div>
                            </div>
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-blue-200 to-transparent -translate-y-1/2 hidden md:block" />
                        </div>

                        <div className="p-10 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                            <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Terminal className="text-blue-600" size={20} />
                                Technical Links
                            </h4>
                            <div className="grid md:grid-cols-2 gap-8 text-sm text-zinc-500 leading-relaxed">
                                <p><strong>Frontend:</strong> <code className="bg-white px-2 py-1 rounded">care-stream.vercel.app</code></p>
                                <p><strong>Backend API:</strong> <code className="bg-white px-2 py-1 rounded">carestream-cloud.duckdns.org</code></p>
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
