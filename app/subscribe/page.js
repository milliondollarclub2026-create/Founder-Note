'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, Mic, Brain, Tag, MessageCircle, Zap, Shield, CreditCard, Calendar, Crown, Check, ArrowRight, Sparkles } from 'lucide-react'
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
const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    description: 'Get started with voice notes',
    features: [
      '5 notes per month',
      '15 minutes transcription',
      'AI transcription & summaries',
      'Brain Dump synthesis',
      'Remy AI assistant',
      'Tags & folders',
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 14.99,
    description: 'More notes and recording time',
    features: [
      '15 notes per month',
      '150 minutes transcription',
      'AI transcription & summaries',
      'Brain Dump synthesis',
      'Remy AI assistant',
      'Tags & folders',
    ],
    cta: 'Subscribe',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    key: 'plus',
    name: 'Plus',
    price: 24.99,
    description: 'Maximum limits + Google Calendar',
    features: [
      '30 notes per month',
      '300 minutes transcription',
      'AI transcription & summaries',
      'Brain Dump synthesis',
      'Advanced Remy AI',
      'Tags & folders',
      'Google Calendar integration',
      'Priority support',
    ],
    cta: 'Subscribe',
    highlighted: false,
    badge: 'Best Value',
  },
]

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
  const [processingPlan, setProcessingPlan] = useState(null)
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

      // Check if user is already subscribed or has chosen a plan
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_status, onboarding_completed, plan_name')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profile?.subscription_status === 'active' || profile?.plan_name) {
        // Already subscribed or has chosen a plan (including free), go to dashboard
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

  const handleSelectPlan = async (planKey) => {
    setError('')
    setProcessingPlan(planKey)
    setIsProcessing(true)

    try {
      // Free plan - mark selection and go to dashboard
      if (planKey === 'free') {
        const supabase = createClient()
        // Set plan_name to 'free' to indicate user has made their choice
        await supabase
          .from('user_profiles')
          .update({ plan_name: 'free' })
          .eq('user_id', user.id)

        router.push('/dashboard')
        return
      }

      // Paid plans - create checkout
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType: planKey })
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
      setProcessingPlan(null)
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
        <div className="auth-ring auth-ring-1" style={{ width: 400, height: 400 }} />
        <div className="auth-ring auth-ring-2" style={{ width: 720, height: 720 }} />
        <div className="auth-ring auth-ring-3" style={{ width: 1040, height: 1040 }} />

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

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4 tracking-[-0.01em]">
            Choose your plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Start free or unlock more with a subscription. Upgrade anytime.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive text-center animate-fade-in">
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          {PLANS.map((plan, index) => (
            <div
              key={plan.key}
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

                <Button
                  onClick={() => handleSelectPlan(plan.key)}
                  disabled={isProcessing}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 font-body ${
                    plan.highlighted
                      ? 'bg-white text-[hsl(355,48%,39%)] hover:bg-white/90 shadow-lg'
                      : 'bg-[hsl(355,48%,39%)] text-white hover:bg-[hsl(355,48%,35%)]'
                  }`}
                >
                  {isProcessing && processingPlan === plan.key ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {plan.key === 'free' ? 'Going to dashboard...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                {plan.key === 'free' && (
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    No credit card required
                  </p>
                )}

                {/* Features */}
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          plan.highlighted
                            ? 'bg-white/20'
                            : 'bg-[hsl(355,48%,39%)]/10'
                        }`}
                      >
                        <Check
                          className={`w-3 h-3 ${
                            plan.highlighted ? 'text-white' : 'text-[hsl(355,48%,39%)]'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-sm font-body ${
                          plan.highlighted
                            ? 'text-white/90'
                            : 'text-[#333]'
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground font-body">
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Secure payment
          </span>
          <span>•</span>
          <span>Cancel anytime</span>
          <span>•</span>
          <span>Upgrade whenever you need</span>
        </div>

        {/* Compare plans link */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          <Link href="/pricing" className="underline hover:text-[hsl(355,48%,39%)] transition-colors">
            See detailed plan comparison
          </Link>
        </p>

        {/* Additional info */}
        <p className="text-center text-xs text-muted-foreground/50 mt-4 leading-relaxed">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </main>
    </div>
  )
}
