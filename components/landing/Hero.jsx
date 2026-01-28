'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, ArrowRight, FileText, Zap, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@supabase/ssr'

export default function Hero() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const words = ['instantly', 'automatically', 'perfectly', 'effortlessly', 'intelligently']

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()
  }, [supabase])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [words.length])

  // Voice demo wave data
  const waveData = Array.from({ length: 40 }, (_, i) => ({
    height: Math.sin(i * 0.4) * 20 + Math.random() * 15 + 10,
    delay: i * 0.02,
  }))

  return (
    <section className="landing-hero-bg min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Content */}
        <div className="text-center max-w-4xl mx-auto mb-16 pt-8">
          {/* Beta badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 badge-warm-glow"
            style={{
              background: 'hsl(355 48% 39% / 0.08)',
              border: '1px solid hsl(355 48% 39% / 0.15)',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'hsl(355, 48%, 39%)' }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'hsl(355, 48%, 39%)' }}></span>
            </span>
            <span className="text-sm font-medium font-body" style={{ color: 'hsl(355, 48%, 39%)' }}>
              Now in Beta
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-display text-gray-900 mb-6 leading-[1.1]"
          >
            Capture your ideas
            <br />
            <span className="relative inline-block">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentWordIndex}
                  initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
                  transition={{ duration: 0.4 }}
                  className="text-glow-garnet"
                  style={{ color: 'hsl(355, 48%, 39%)' }}
                >
                  {words[currentWordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed font-body"
          >
            Transform your voice into organized notes, actionable tasks, and
            intelligent insights. Built for founders who think faster than they type.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href={isAuthenticated ? '/dashboard' : '/auth'}
              className="px-8 py-3.5 rounded-xl text-base font-semibold text-white flex items-center gap-2 transition-all duration-300 hover:scale-105 garnet-glow font-body"
              style={{ backgroundColor: 'hsl(355, 48%, 39%)' }}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/#features"
              className="px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 font-body border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900 hover:bg-white/50"
            >
              See Features
            </Link>
          </motion.div>
        </div>

        {/* Voice Demo Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)' }}>
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-white/40 text-sm font-body">Founder Notes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs font-body">Live Demo</span>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
            </div>

            {/* Content */}
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left: Voice Input */}
              <div className="p-8 border-r border-white/5">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'hsl(355 48% 39% / 0.2)' }}
                  >
                    <Mic className="w-5 h-5" style={{ color: 'hsl(355, 48%, 39%)' }} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium font-body">Voice Input</p>
                    <p className="text-white/40 text-xs font-body">Recording...</p>
                  </div>
                </div>

                {/* Sound wave visualization */}
                <div className="flex items-center gap-[2px] h-16 mb-6">
                  {waveData.map((bar, i) => (
                    <motion.div
                      key={i}
                      className="w-[3px] rounded-full"
                      style={{ backgroundColor: 'hsl(355 48% 39% / 0.6)' }}
                      initial={{ height: 4 }}
                      animate={{
                        height: [4, bar.height, 4],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: bar.delay,
                      }}
                    />
                  ))}
                </div>

                <p className="text-white/60 text-sm font-body leading-relaxed italic">
                  &quot;We need to follow up with the investor from yesterday&apos;s meeting. Also, schedule a team sync for the product roadmap review...&quot;
                </p>
              </div>

              {/* Right: AI Output */}
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'hsl(355 48% 39% / 0.2)' }}
                  >
                    <Zap className="w-5 h-5" style={{ color: 'hsl(355, 48%, 39%)' }} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium font-body">AI Output</p>
                    <p className="text-white/40 text-xs font-body">Processed</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { icon: FileText, label: 'Note', text: 'Investor Follow-up', color: 'hsl(355 48% 39% / 0.2)' },
                    { icon: Zap, label: 'Task', text: 'Follow up with investor', color: 'hsl(355 48% 39% / 0.15)' },
                    { icon: MessageSquare, label: 'Meeting', text: 'Team sync - Product roadmap', color: 'hsl(355 48% 39% / 0.1)' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.2, duration: 0.4 }}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: item.color }}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(355, 48%, 39%)' }} />
                      <div className="flex-1">
                        <span className="text-xs font-medium text-white/50 font-body">{item.label}</span>
                        <p className="text-sm text-white font-body">{item.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
