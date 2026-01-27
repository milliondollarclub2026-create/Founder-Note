'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Sparkles, Loader2, Mic, Brain, Tag, MessageCircle, Zap, Shield, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Create Supabase client
const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export default function SubscribePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  // Check auth and subscription status on mount
  useEffect(() => {
    const checkStatus = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      setUser(user)

      // Check if user is already subscribed
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_status, onboarding_completed')
        .eq('user_id', user.id)
        .single()

      if (profile?.subscription_status === 'active') {
        // Already subscribed, go to dashboard
        router.push('/')
        return
      }

      if (!profile?.onboarding_completed) {
        // Onboarding not done, send back
        router.push('/onboarding')
        return
      }

      setIsLoading(false)
    }

    checkStatus()
  }, [router])

  // Poll for subscription status after redirect back from Lemon Squeezy
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const checkoutSuccess = urlParams.get('success')

    if (checkoutSuccess === 'true' && user) {
      // Start polling for subscription confirmation
      setIsProcessing(true)
      const pollInterval = setInterval(async () => {
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_status')
          .eq('user_id', user.id)
          .single()

        if (profile?.subscription_status === 'active') {
          clearInterval(pollInterval)
          router.push('/')
        }
      }, 2000) // Poll every 2 seconds

      // Stop polling after 30 seconds
      setTimeout(() => {
        clearInterval(pollInterval)
        setIsProcessing(false)
      }, 30000)

      return () => clearInterval(pollInterval)
    }
  }, [user, router])

  const handleSubscribe = async () => {
    setIsProcessing(true)
    setError('')

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.checkoutUrl) {
        // Redirect to Lemon Squeezy checkout
        window.location.href = data.checkoutUrl
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, hsl(34 42% 92%) 0%, hsl(34 35% 89%) 50%, hsl(34 40% 91%) 100%)' }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Show processing state after returning from checkout
  if (isProcessing && new URLSearchParams(window.location.search).get('success') === 'true') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(34 42% 92%) 0%, hsl(34 35% 89%) 50%, hsl(34 40% 91%) 100%)' }}
      >
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full blur-[120px] auth-orb-1"
            style={{ background: 'hsl(355 48% 39% / 0.15)' }}
          />
          <div
            className="absolute -bottom-20 -right-20 w-[600px] h-[600px] rounded-full blur-[140px] auth-orb-2"
            style={{ background: 'hsl(355 48% 50% / 0.12)' }}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(355 48% 39%) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        <div className="relative z-10 text-center max-w-md">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border"
            style={{
              background: 'hsl(355 48% 39% / 0.08)',
              borderColor: 'hsl(355 48% 39% / 0.15)',
            }}
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-3 tracking-[-0.01em]">Activating your account...</h1>
          <p className="text-muted-foreground">
            Confirming your payment. This will only take a moment.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, hsl(34 42% 92%) 0%, hsl(34 35% 89%) 50%, hsl(34 40% 91%) 100%)' }}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Orbs in diagonal corners */}
        <div
          className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full blur-[120px] auth-orb-1"
          style={{ background: 'hsl(355 48% 39% / 0.15)' }}
        />
        <div
          className="absolute -bottom-20 -right-20 w-[600px] h-[600px] rounded-full blur-[140px] auth-orb-2"
          style={{ background: 'hsl(355 48% 50% / 0.12)' }}
        />
        <div
          className="absolute top-[30%] right-[8%] w-72 h-72 rounded-full blur-[80px] auth-orb-3"
          style={{ background: 'hsl(25 45% 50% / 0.1)' }}
        />

        {/* Concentric rings */}
        <div className="auth-ring auth-ring-1" />
        <div className="auth-ring auth-ring-2" />
        <div className="auth-ring auth-ring-3" />
        <div className="auth-ring auth-ring-4" />
        <div className="auth-ring auth-ring-5" />
        <div className="auth-ring auth-ring-6" />

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(355 48% 39%) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-center">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-[-0.01em]">Founder Note</span>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4 tracking-[-0.01em]">
            One plan. Everything included.
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Unlimited recordings, AI summaries, and your personal assistant.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <div
            className="rounded-2xl border-2 overflow-hidden transition-all duration-200"
            style={{
              background: 'hsl(34 45% 96%)',
              borderColor: 'hsl(355 48% 39% / 0.2)',
              boxShadow: '0 8px 32px -8px hsl(355 48% 39% / 0.1), 0 2px 6px hsl(34 30% 50% / 0.1)',
            }}
          >
            {/* Card Header */}
            <div
              className="px-8 py-6 text-center border-b"
              style={{
                background: 'linear-gradient(135deg, hsl(355 48% 39% / 0.06) 0%, hsl(34 38% 92% / 0.5) 100%)',
                borderColor: 'hsl(34 30% 80%)',
              }}
            >
              <p className="text-sm font-medium text-primary uppercase tracking-wide mb-2">
                Full Access
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-foreground tracking-tight">$14.99</span>
                <span className="text-lg text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Cancel anytime.
              </p>
            </div>

            {/* Features */}
            <div className="px-8 py-8">
              <ul className="space-y-4">
                {[
                  { icon: Mic, text: 'Unlimited recordings' },
                  { icon: Sparkles, text: 'AI transcription and summaries' },
                  { icon: Brain, text: 'Brain Dump synthesis' },
                  { icon: MessageCircle, text: 'Remy, your personal AI assistant' },
                  { icon: Tag, text: 'Tags, folders, and search' },
                  { icon: Zap, text: 'Action items and follow-ups' },
                  { icon: Shield, text: 'Encrypted cloud backup' },
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'hsl(355 48% 39% / 0.08)' }}
                    >
                      <feature.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground text-[15px]">{feature.text}</span>
                  </li>
                ))}
              </ul>

              {error && (
                <div className="mt-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive animate-fade-in">
                  {error}
                </div>
              )}

              {/* CTA Button */}
              <Button
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="w-full h-14 mt-8 rounded-xl text-lg font-semibold shadow-lg transition-all duration-200 cta-shimmer"
                style={{
                  boxShadow: '0 4px 14px -2px hsl(355 48% 39% / 0.25)',
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Get started
                  </>
                )}
              </Button>

              {/* Trust badges */}
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground/60">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Secure checkout
                </span>
                <span>·</span>
                <span>Powered by Lemon Squeezy</span>
              </div>
            </div>
          </div>

          {/* Additional info */}
          <p className="text-center text-xs text-muted-foreground/50 mt-6 leading-relaxed">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            Your subscription renews monthly until cancelled.
          </p>
        </div>
      </main>
    </div>
  )
}
