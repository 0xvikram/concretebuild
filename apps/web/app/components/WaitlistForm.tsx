"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        alert("Failed to join waitlist. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="waitlist" className="py-24 relative z-10">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-600/15 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-2xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            Get <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">Early Access</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Be among the first to tokenize real estate assets on our platform. Join the waitlist and we&apos;ll notify you when we launch.
          </p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-12 bg-zinc-900/60 border border-emerald-500/30 rounded-2xl backdrop-blur-sm"
          >
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-3">You&apos;re on the list!</h3>
            <p className="text-zinc-400">We&apos;ll reach out to <span className="text-emerald-400 font-medium">{email}</span> when early access opens.</p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="p-8 md:p-12 bg-zinc-900/60 border border-zinc-800/50 rounded-2xl backdrop-blur-sm space-y-6"
          >
            <div>
              <label htmlFor="waitlist-name" className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
              <input
                id="waitlist-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-5 py-3.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            <div>
              <label htmlFor="waitlist-email" className="block text-sm font-medium text-zinc-300 mb-2">Email Address <span className="text-indigo-400">*</span></label>
              <input
                id="waitlist-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-5 py-3.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            <div>
              <label htmlFor="waitlist-role" className="block text-sm font-medium text-zinc-300 mb-2">I am a...</label>
              <select
                id="waitlist-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-5 py-3.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none"
              >
                <option value="" className="bg-zinc-900">Select your role</option>
                <option value="developer" className="bg-zinc-900">Real Estate Developer</option>
                <option value="investor" className="bg-zinc-900">Investor</option>
                <option value="syndicator" className="bg-zinc-900">Syndicator</option>
                <option value="advisor" className="bg-zinc-900">Financial Advisor</option>
                <option value="other" className="bg-zinc-900">Other</option>
              </select>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Joining...</>
              ) : (
                <>Join the Waitlist <ArrowRight className="w-5 h-5" /></>
              )}
            </motion.button>

            <p className="text-center text-zinc-600 text-xs">No spam. Unsubscribe anytime.</p>
          </motion.form>
        )}
      </div>
    </section>
  );
}
