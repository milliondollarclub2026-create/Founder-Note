'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Sparkles, Loader2, Mic, Brain, Tag, MessageCircle, Zap, Shield, CreditCard, Calendar, Crown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Create Supabase client
const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Plan configurations
const PLANS = {
  pro: {
    name: 'Pro',
    price: 14.99,
    description: 'Everything you need to capture ideas',
    features: [
      { icon: Mic, text: '15 notes and 150 minutes per month' },
      { icon: Sparkles, text: 'AI transcription and summaries' },
      { icon: Brain, text: 'Brain Dump synthesis' },
      { icon: MessageCircle, text: 'Remy AI assistant' },
      { icon: Tag, text: 'Tags, folders, and search' },
      { icon: Zap, text: 'Action items and follow-ups' },
    ],
  },
  plus: {
    name: 'Plus',
    price: 24.99,
    description: 'For power users who need more',
    features: [
      { icon: Mic, text: '30 notes and 300 minutes per month' },
      { icon: Sparkles, text: 'AI transcription and summaries' },
      { icon: Brain, text: 'Brain Dump synthesis' },
      { icon: Crown, text: 'Advanced Remy AI assistant' },
      { icon: Tag, text: 'Tags, folders, and search' },
      { icon: Calendar, text: 'Google Calendar integration' },
      { icon: Shield, text: 'Priority support' },
    ],
  },
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, hsl(34 42% 92%) 0%, hsl(34 35% 89%) 50%, hsl(34 40% 91%) 100%)' }}
    >
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )
}

// Main page wrapper with Suspense
export default function SubscribePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SubscribeContent />
    </Suspense>
  )
}

function SubscribeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('pro')

  // Get plan from URL or default to 'pro'
  useEffect(() => {
    const planParam = searchParams.get('plan')
    if (planParam && PLANS[planParam]) {
      setSelectedPlan(planParam)
    }
  }, [searchParams])

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
        .maybeSingle()

      if (profile?.subscription_status === 'active') {
        // Already subscribed, go to dashboard
        router.push('/dashboard')
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
          .maybeSingle()

        if (profile?.subscription_status === 'active') {
          clearInterval(pollInterval)
          router.push('/dashboard')
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
        body: JSON.stringify({ planType: selectedPlan })
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

  const plan = PLANS[selectedPlan]

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
        <div className="auth-ring auth-ring-1" style={{ width: 400, height: 400 }} />
        <div className="auth-ring auth-ring-2" style={{ width: 720, height: 720 }} />
        <div className="auth-ring auth-ring-3" style={{ width: 1040, height: 1040 }} />
        <div className="auth-ring auth-ring-4" style={{ width: 1360, height: 1360 }} />
        <div className="auth-ring auth-ring-5" style={{ width: 1680, height: 1680 }} />
        <div className="auth-ring auth-ring-6" style={{ width: 2000, height: 2000 }} />

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(355 48% 39%) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Top-left logo */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-2.5">
        <img src="/logo.png" alt="Founder Note" width={40} height={40} className="w-10 h-10 rounded-xl shadow-sm" />
        <span className="text-xl font-bold tracking-[-0.01em]">Founder Note</span>
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4 tracking-[-0.01em]">
            Choose your plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Unlock the full power of Founder Note
          </p>
        </div>

        {/* Plan Selector */}
        <div className="flex justify-center gap-4 mb-8">
          {Object.entries(PLANS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => setSelectedPlan(key)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                selectedPlan === key
                  ? 'bg-[hsl(355,48%,39%)] text-white shadow-lg'
                  : 'bg-white/50 text-[#666] hover:bg-white border border-[hsl(34_25%_85%)]'
              }`}
            >
              {p.name} - ${p.price}/mo
            </button>
          ))}
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto pt-6">
          <div
            className="relative rounded-3xl text-white shadow-2xl overflow-visible"
            style={{
              background: 'linear-gradient(135deg, hsl(355, 48%, 39%) 0%, hsl(355, 50%, 30%) 100%)',
            }}
          >
            {/* Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-white text-[hsl(355,48%,39%)] text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg font-body">
                {selectedPlan === 'plus' ? 'Best Value' : 'Most Popular'}
              </div>
            </div>

            {/* Card Content */}
            <div className="p-10 pt-12">
              <h3 className="text-2xl font-display mb-1">{plan.name}</h3>
              <p className="text-white/70 text-sm font-body mb-8">
                {plan.description}
              </p>

              <div className="mb-8">
                <span className="text-6xl font-display">${plan.price}</span>
                <span className="text-white/70 font-body">/ month</span>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-white/10 border border-white/20 text-sm text-white animate-fade-in">
                  {error}
                </div>
              )}

              <Button
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="w-full py-4 h-auto rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 font-body bg-white text-[hsl(355,48%,39%)] hover:bg-white/90 shadow-lg text-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Subscribe to {plan.name}
                  </>
                )}
              </Button>

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
                {plan.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 animate-fade-in"
                    style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 text-white/90" />
                    </div>
                    <span className="text-white/90 text-[15px] font-body">{feature.text}</span>
                  </li>
                ))}
              </ul>

              {/* Trust badges */}
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
          </div>

          {/* Compare plans link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link href="/pricing" className="underline hover:text-[hsl(355,48%,39%)] transition-colors">
              Compare all plans
            </Link>
          </p>

          {/* Additional info */}
          <p className="text-center text-xs text-muted-foreground/50 mt-4 leading-relaxed">
            By subscribing, you agree to our{' '}
            <Link href="/terms" className="underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </main>
    </div>
  )
}
