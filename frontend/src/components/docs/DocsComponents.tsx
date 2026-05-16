"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

export const DocsSection = ({ title, icon: Icon, children, id }: { title: string, icon?: LucideIcon, children: React.ReactNode, id?: string }) => {
    return (
        <motion.section 
            id={id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="py-24 border-t border-zinc-100 first:border-t-0"
        >
            <div className="flex items-center gap-3 mb-12">
                {Icon && <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Icon size={24} /></div>}
                <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">{title}</h2>
            </div>
            {children}
        </motion.section>
    );
};

export const DocsCard = ({ title, description, icon: Icon, delay = 0 }: { title: string, description: string, icon: LucideIcon, delay?: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative p-8 bg-white border border-zinc-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300"
        >
            <div className="absolute inset-0 bg-linear-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative">
                <div className="mb-6 p-3 w-fit bg-zinc-50 rounded-xl text-zinc-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-zinc-900">{title}</h3>
                <p className="text-zinc-600 leading-relaxed text-[15px]">{description}</p>
            </div>
        </motion.div>
    );
};
