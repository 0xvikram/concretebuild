"use client";

import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6">
      <div className="mx-4 px-8 py-3 rounded-full bg-black/40 backdrop-blur-xl border border-zinc-700/40 flex items-center justify-between gap-12 max-w-fit">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 tracking-tight">
            Concrete Build
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link>
          <Link href="#roadmap" className="hover:text-white transition-colors">Roadmap</Link>
        </div>

        <div className="flex items-center gap-3">
          <a href="https://cbld.as.me/schedule/4e1f8818/appointment/77973824/calendar/8272571?appointmentTypeIds%5B%5D=77973824" target="_blank" rel="noreferrer">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full font-medium text-xs bg-zinc-700/30 border border-zinc-600/40 text-white hover:bg-zinc-600/40 transition-colors"
            >
              Book
            </motion.button>
          </a>
          <Link href="#waitlist">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-5 py-2 rounded-full font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all"
            >
              Join <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
