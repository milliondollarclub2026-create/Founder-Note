'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Mic, Sparkles, Brain, MessageCircle, Tag, Zap, Shield, Calendar, Crown, ArrowRight } from 'lucide-react'
import Navigation from '@/components/landing/Navigation'
import Footer from '@/components/landing/Footer'

const plans = [
  {
    name: 'Free',
    price: 0,
    description: 'Get started with voice notes',
    features: [
      { text: '5 notes per month', included: true },
      { text: '15 minutes transcription', included: true },
      { text: 'AI transcription', included: true },
      { text: 'AI summaries & key points', included: true },
      { text: 'Brain Dump synthesis', included: true },
      { text: 'Remy AI assistant', included: true },
      { text: 'Tags & folders', included: true },
      { text: 'Google Calendar', included: false },
    ],
    cta: 'Get Started',
    href: '/auth',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 14.99,
    description: 'More notes and recording time',
    features: [
      { text: '15 notes per month', included: true },
      { text: '150 minutes transcription', included: true },
      { text: 'AI transcription', included: true },
      { text: 'AI summaries & key points', included: true },
      { text: 'Brain Dump synthesis', included: true },
      { text: 'Remy AI assistant', included: true },
      { text: 'Tags & folders', included: true },
      { text: 'Google Calendar', included: false },
    ],
    cta: 'Subscribe',
    href: '/subscribe?plan=pro',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Plus',
    price: 24.99,
    description: 'Maximum limits + Google Calendar',
    features: [
      { text: '30 notes per month', included: true },
      { text: '300 minutes transcription', included: true },
      { text: 'AI transcription', included: true },
      { text: 'AI summaries & key points', included: true },
      { text: 'Brain Dump synthesis', included: true },
      { text: 'Advanced Remy AI', included: true },
      { text: 'Tags & folders', included: true },
      { text: 'Google Calendar integration', included: true },
    ],
    cta: 'Subscribe',
    href: '/subscribe?plan=plus',
    highlighted: false,
    badge: 'Best Value',
  },
]

const featureIcons = {
  'AI transcription': Mic,
  'AI summaries': Sparkles,
  'Brain Dump': Brain,
  'Remy AI': MessageCircle,
  'Tags & folders': Tag,
  'Action items': Zap,
  'Google Calendar': Calendar,
  'Advanced Remy': Crown,
}

export default function PricingPage() {
  return (
    <div className="bg-white min-h-screen">
      <Navigation />

      {/* Hero Section */}
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
            <h1 className="text-4xl md:text-6xl font-display text-[#1a1a1a] mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg md:text-xl text-[#666] font-body max-w-2xl mx-auto">
              Start free, upgrade when you need more. No hidden fees.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className={`relative rounded-3xl overflow-visible ${
                  plan.highlighted
                    ? 'text-white shadow-2xl scale-105 z-10'
                    : 'bg-white border border-[hsl(34_25%_85%)] shadow-lg'
                }`}
                style={
                  plan.highlighted
                    ? {
                        background: 'linear-gradient(135deg, hsl(355, 48%, 39%) 0%, hsl(355, 50%, 30%) 100%)',
                      }
                    : {}
                }
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div
                      className={`text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg font-body ${
                        plan.highlighted
                          ? 'bg-white text-[hsl(355,48%,39%)]'
                          : 'bg-[hsl(355,48%,39%)] text-white'
                      }`}
                    >
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div className="p-8 pt-10">
                  <h3
                    className={`text-2xl font-display mb-1 ${
                      plan.highlighted ? 'text-white' : 'text-[#1a1a1a]'
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm font-body mb-6 ${
                      plan.highlighted ? 'text-white/70' : 'text-[#666]'
                    }`}
                  >
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <span
                      className={`text-5xl font-display ${
                        plan.highlighted ? 'text-white' : 'text-[#1a1a1a]'
                      }`}
                    >
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span
                        className={`font-body ${
                          plan.highlighted ? 'text-white/70' : 'text-[#666]'
                        }`}
                      >
                        / month
                      </span>
                    )}
                  </div>

                  <Link
                    href={plan.href}
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 font-body ${
                      plan.highlighted
                        ? 'bg-white text-[hsl(355,48%,39%)] hover:bg-white/90 shadow-lg'
                        : 'bg-[hsl(355,48%,39%)] text-white hover:bg-[hsl(355,48%,35%)]'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {/* Features */}
                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            feature.included
                              ? plan.highlighted
                                ? 'bg-white/20'
                                : 'bg-[hsl(355,48%,39%)]/10'
                              : 'bg-gray-100'
                          }`}
                        >
                          {feature.included ? (
                            <Check
                              className={`w-3 h-3 ${
                                plan.highlighted ? 'text-white' : 'text-[hsl(355,48%,39%)]'
                              }`}
                            />
                          ) : (
                            <span className="w-2 h-0.5 bg-gray-300 rounded" />
                          )}
                        </div>
                        <span
                          className={`text-sm font-body ${
                            feature.included
                              ? plan.highlighted
                                ? 'text-white/90'
                                : 'text-[#333]'
                              : 'text-gray-400'
                          }`}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Feature Comparison */}
          <motion.div
            className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[hsl(34_25%_82%)] max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="p-8 border-b border-[hsl(34_25%_82%)]">
              <h2 className="text-2xl font-display text-[#1a1a1a]">Compare plans</h2>
              <p className="text-[#888] font-body mt-1">See what's included in each tier</p>
            </div>
            <div className="p-8 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[hsl(34_30%_94%)]">
                    <th className="text-left py-4 pr-4 text-sm font-semibold text-[#1a1a1a] font-body">
                      Feature
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-[#1a1a1a] font-body">
                      Free
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-[hsl(355,48%,39%)] font-body">
                      Pro
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-[#1a1a1a] font-body">
                      Plus
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Notes per month', free: '5', pro: '15', plus: '30' },
                    { feature: 'Transcription minutes', free: '15', pro: '150', plus: '300' },
                    { feature: 'AI transcription', free: true, pro: true, plus: true },
                    { feature: 'AI summaries & key points', free: true, pro: true, plus: true },
                    { feature: 'Brain Dump synthesis', free: true, pro: true, plus: true },
                    { feature: 'Remy AI assistant', free: 'Standard', pro: 'Standard', plus: 'Advanced' },
                    { feature: 'Tags & folders', free: true, pro: true, plus: true },
                    { feature: 'Action items', free: true, pro: true, plus: true },
                    { feature: 'Google Calendar', free: false, pro: false, plus: true },
                    { feature: 'Priority support', free: false, pro: false, plus: true },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-[hsl(34_30%_94%)] last:border-0">
                      <td className="py-4 pr-4 text-sm text-[#444] font-body">{row.feature}</td>
                      <td className="py-4 px-4 text-center">
                        {typeof row.free === 'boolean' ? (
                          row.free ? (
                            <Check className="w-5 h-5 text-[hsl(355,48%,39%)] mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )
                        ) : (
                          <span className="text-sm font-medium text-[#1a1a1a] font-body">
                            {row.free}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center bg-[hsl(355,48%,39%)]/5">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? (
                            <Check className="w-5 h-5 text-[hsl(355,48%,39%)] mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )
                        ) : (
                          <span className="text-sm font-medium text-[hsl(355,48%,39%)] font-body">
                            {row.pro}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {typeof row.plus === 'boolean' ? (
                          row.plus ? (
                            <Check className="w-5 h-5 text-[hsl(355,48%,39%)] mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )
                        ) : (
                          <span className="text-sm font-medium text-[#1a1a1a] font-body">
                            {row.plus}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-[#888] font-body"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Secure payment
            </span>
            <span>•</span>
            <span>Cancel anytime</span>
            <span>•</span>
            <span>No hidden fees</span>
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
              Check our FAQ
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Terms */}
          <p className="text-center text-xs text-[#999] font-body mt-8 leading-relaxed">
            By subscribing, you agree to our{' '}
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:text-[hsl(355,48%,39%)] transition-colors"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-[hsl(355,48%,39%)] transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>
      <Footer />
    </div>
  )
}
