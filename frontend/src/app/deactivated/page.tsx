import { ShieldAlert, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DeactivatedPage() {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 to-zinc-950">
            <div className="w-full max-w-[480px] text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 mb-8">
                        <ShieldAlert className="w-10 h-10 text-rose-500" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-4 uppercase font-mono">
                        Account_Deactivated
                    </h1>
                    <div className="h-1 w-20 bg-rose-500 mx-auto mb-6 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                    
                    <p className="text-zinc-400 text-lg font-medium leading-relaxed mb-8">
                        The security protocol for this identity index has been restricted. 
                        Your access to the CareStream platform is currently suspended.
                    </p>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-xl rounded-2xl p-8 mb-10 text-left">
                    <h3 className="text-zinc-300 font-mono text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Next_Steps
                    </h3>
                    <ul className="space-y-4">
                        <li className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                                <Mail className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div>
                                <p className="text-zinc-200 text-sm font-bold">Contact Administration</p>
                                <p className="text-zinc-500 text-xs mt-0.5">Reach out to your department lead to request reactivation.</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                                <ShieldAlert className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div>
                                <p className="text-zinc-200 text-sm font-bold">Security Audit</p>
                                <p className="text-zinc-500 text-xs mt-0.5">Automatic deactivation may occur during routine identity audits.</p>
                            </div>
                        </li>
                    </ul>
                </div>

                <Link href="/login" passHref>
                    <Button className="w-full h-14 bg-white hover:bg-zinc-200 text-black font-black font-mono tracking-widest text-xs rounded-xl shadow-2xl transition-all">
                        <LogIn className="w-4 h-4 mr-2" />
                        RETURN_TO_AUTHENTICATION
                    </Button>
                </Link>

                <p className="mt-12 text-[10px] text-zinc-700 uppercase tracking-[0.3em] font-black">
                    CareStream // Identity_Shield_v4.0
                </p>
            </div>
        </div>
    );
}
