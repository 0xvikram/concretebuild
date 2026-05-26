"use client";

import { motion } from "framer-motion";
import { Coins, TrendingUp } from "lucide-react";

const tokenTiers = [
  { amount: "10K CBLD", price: "$100", icon: Coins },
  { amount: "100K CBLD", price: "$1,000", icon: TrendingUp, featured: true },
  { amount: "1M CBLD", price: "$10K", icon: Coins },
];

export default function TokenPricing() {
  return (
    <section id="token" className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold mb-16 text-center"
          style={{ color: "#4f46e5" }}
        >
          Buy CBLD Token
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {tokenTiers.map((tier, idx) => {
            const Icon = tier.icon;
            return (
              <motion.div
                key={tier.amount}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
                className={`relative p-8 rounded-2xl border backdrop-blur-sm transition-all ${
                  tier.featured
                    ? "border-indigo-500/60 bg-gradient-to-br from-indigo-600/20 to-indigo-900/10 ring-1 ring-indigo-500/30 shadow-[0_0_40px_rgba(79,70,229,0.25)]"
                    : "border-zinc-800/50 bg-zinc-900/40 hover:border-zinc-700/50"
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-500 text-white text-xs font-bold">
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-lg ${tier.featured ? "bg-indigo-500/20" : "bg-zinc-800/50"}`}>
                    <Icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Amount</p>
                    <p className="text-xl font-bold text-white">{tier.amount}</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">{tier.price}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
