"use client";

import { motion } from "framer-motion";
import { FileText, ExternalLink } from "lucide-react";

const steps = [
  { step: "01", title: "Define Your Project", desc: "Select the commercial real estate asset and set your fundraising goals." },
  { step: "02", title: "Tokenize the Asset", desc: "We deploy EVM-compatible smart contracts representing fractional ownership." },
  { step: "03", title: "Launch & Fund", desc: "Offer tokens via a branded launch page. Investors buy in using fiat or crypto." },
  { step: "04", title: "Track, Distribute, & Grow", desc: "Smart contracts handle ownership, real-time dividends, and built-in resale options." }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-zinc-900/20 border-y border-zinc-800/50 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center">How It Works</h2>
        
        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((s, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative"
            >
              <div className="text-6xl font-black text-zinc-800/50 mb-4 tracking-tighter">{s.step}</div>
              <h3 className="text-xl font-semibold mb-2 text-indigo-300">{s.title}</h3>
              <p className="text-zinc-400 text-sm">{s.desc}</p>
              
              {/* Connector line for large screens */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[1px] bg-gradient-to-r from-zinc-700 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 flex justify-center"
        >
          <a href="https://docs.google.com/document/d/15d7mlbJA01Qfv4vk1L_XajHjN1fnQRUZwH8aDBFL98g/edit?usp=sharing" target="_blank" rel="noreferrer">
            <button className="flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] transition-all">
              <FileText className="w-5 h-5" />
              Read Our Whitepaper
              <ExternalLink className="w-4 h-4" />
            </button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
