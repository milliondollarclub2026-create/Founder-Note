'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Mic, Sparkles, Brain, MessageCircle, Tag, Zap, Shield, MessageSquare, ArrowRight } from 'lucide-react'
import Navigation from '@/components/landing/Navigation'
import Footer from '@/components/landing/Footer'

export default function PricingPage() {
  const betaFeatures = [
    { icon: Mic, text: '10 notes and 100 minutes per month' },
    { icon: Sparkles, text: 'AI transcription and summaries' },
    { icon: Brain, text: 'Brain Dump synthesis' },
    { icon: MessageCircle, text: 'Remy, your personal AI assistant' },
    { icon: Tag, text: 'Tags, folders, and search' },
    { icon: Zap, text: 'Action items and follow-ups' },
    { icon: Shield, text: 'Early adopter pricing, locked in' },
  ]

  return (
    <div className="bg-white min-h-screen">
      <Navigation />

      {/* Hero Section with Warm Gradient */}
      <section className="relative min-h-screen pt-28 pb-24 px-6 overflow-hidden">
        {/* Warm cream gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(34_42%_96%)] via-[hsl(34_38%_94%)] to-white" />

        {/* Grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-sm font-medium font-body"
              style={{
                backgroundColor: 'hsl(355 48% 39% / 0.08)',
                color: 'hsl(355, 48%, 39%)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'hsl(355, 48%, 39%)' }} />
              Beta Program
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-display text-[#1a1a1a] mb-4">
              Shape the future with us
            </h1>
            <p className="text-lg md:text-xl text-[#666] font-body max-w-2xl mx-auto">
              Join the beta. Get early access and a price that stays.
            </p>
          </motion.div>

          {/* Single Beta Pricing Card */}
          <div className="max-w-lg mx-auto mb-20 pt-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative rounded-3xl text-white shadow-2xl overflow-visible"
              style={{
                background: 'linear-gradient(135deg, hsl(355, 48%, 39%) 0%, hsl(355, 50%, 30%) 100%)',
              }}
            >
              {/* Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-white text-[hsl(355,48%,39%)] text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg font-body">
                  Limited Beta
                </div>
              </div>

              {/* Card Content */}
              <div className="p-10 pt-12">
                <h3 className="text-2xl font-display mb-1">Beta Plan</h3>
                <p className="text-white/70 text-sm font-body mb-8">
                  Everything you need to capture and organize your ideas.
                </p>

                <div className="mb-8">
                  <span className="text-6xl font-display">$14.99</span>
                  <span className="text-white/70 font-body">/ month</span>
                  <p className="text-white/50 text-sm font-body mt-2">
                    Locked in. Price increases at launch.
                  </p>
                </div>

                <Link
                  href="/auth"
                  className="w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 font-body bg-white text-[hsl(355,48%,39%)] hover:bg-white/90 shadow-lg text-lg"
                >
                  Join the beta
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {/* Free Trial Highlight */}
                <div className="mt-4 py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-center">
                  <p className="text-white font-semibold text-sm font-body">
                    Start with a 1-day free trial
                  </p>
                  <p className="text-white/70 text-xs font-body mt-0.5">
                    No charge until your trial ends. Cancel anytime.
                  </p>
                </div>

                {/* Features */}
                <ul className="mt-10 space-y-4">
                  {betaFeatures.map((feature, i) => (
                    <motion.li
                      key={i}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06, duration: 0.4 }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-4 h-4 text-white/90" />
                      </div>
                      <span className="text-white/90 text-[15px] font-body">{feature.text}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* Trust */}
                <div className="mt-8 pt-6 border-t border-white/15 flex items-center justify-center gap-4 text-xs text-white/40 font-body">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Secure checkout
                  </span>
                  <span>·</span>
                  <span>Cancel anytime</span>
                  <span>·</span>
                  <span>Powered by Lemon Squeezy</span>
                </div>
              </div>
            </motion.div>

            {/* Additional info */}
            <p className="text-center text-xs text-[#999] font-body mt-6 leading-relaxed">
              By subscribing, you agree to our{' '}
              <Link href="/terms" className="underline underline-offset-2 hover:text-[hsl(355,48%,39%)] transition-colors">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-[hsl(355,48%,39%)] transition-colors">Privacy Policy</Link>.
            </p>
          </div>

          {/* What's Included Section */}
          <motion.div
            className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[hsl(34_25%_82%)] max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="p-8 border-b border-[hsl(34_25%_82%)]">
              <h2 className="text-2xl font-display text-[#1a1a1a]">{"What's included"}</h2>
              <p className="text-[#888] font-body mt-1">Everything in the beta plan</p>
            </div>
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-5">
                {[
                  { label: 'Notes per month', value: '10' },
                  { label: 'Audio minutes', value: '100 min/mo' },
                  { label: 'Languages', value: '31+' },
                  { label: 'AI Transcription', value: true },
                  { label: 'AI Summaries', value: true },
                  { label: 'Brain Dump', value: true },
                  { label: 'Remy AI Assistant', value: true },
                  { label: 'Tags & Folders', value: true },
                  { label: 'Search', value: true },
                  { label: 'Action Items', value: true },
                  { label: 'Export Formats', value: 'All' },
                  { label: 'Support', value: 'Priority' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[hsl(34_30%_94%)] last:border-0">
                    <span className="text-[#444] font-body text-sm">{row.label}</span>
                    {typeof row.value === 'boolean' ? (
                      <Check className="w-5 h-5 text-[hsl(355,48%,39%)]" />
                    ) : (
                      <span className="text-[#1a1a1a] font-medium font-body text-sm">{row.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* FAQ CTA */}
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[#888] font-body mb-4">Have questions?</p>
            <Link
              href="/#faq"
              className="inline-flex items-center gap-2 text-[hsl(355,48%,39%)] font-semibold font-body hover:underline"
            >
              <MessageSquare className="w-4 h-4" />
              Check our FAQ
            </Link>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
