'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Sparkles, Check, Loader2, Mic, Brain, Tag, MessageCircle, Zap, Shield, CreditCard } from 'lucide-react'
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Show processing state after returning from checkout
  if (isProcessing && new URLSearchParams(window.location.search).get('success') === 'true') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Activating Your Account...</h1>
          <p className="text-muted-foreground">
            Please wait while we confirm your payment and unlock full access.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Founder Note</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Unlock Your Second Brain
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            One simple subscription. Full access. No limits. Transform your voice notes into 
            actionable insights and never lose a brilliant idea again.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <div className="bg-card rounded-3xl border-2 border-primary/20 shadow-xl overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-8 py-6 text-center border-b border-border">
              <p className="text-sm font-medium text-primary uppercase tracking-wide mb-2">
                Full Access
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-foreground">$14.99</span>
                <span className="text-lg text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Cancel anytime. No questions asked.
              </p>
            </div>

            {/* Features */}
            <div className="px-8 py-8">
              <ul className="space-y-4">
                {[
                  { icon: Mic, text: 'Unlimited voice recordings' },
                  { icon: Sparkles, text: 'AI-powered transcription & summaries' },
                  { icon: Brain, text: 'Brain Dump synthesis across all notes' },
                  { icon: MessageCircle, text: 'Remy AI assistant with full context' },
                  { icon: Tag, text: 'Smart organization with tags & folders' },
                  { icon: Zap, text: 'Action item extraction & tracking' },
                  { icon: Shield, text: 'Secure cloud sync & backup' },
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground">{feature.text}</span>
                  </li>
                ))}
              </ul>

              {error && (
                <div className="mt-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* CTA Button */}
              <Button
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="w-full h-14 mt-8 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Activate Full Access
                  </>
                )}
              </Button>

              {/* Trust badges */}
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Secure checkout
                </span>
                <span>•</span>
                <span>Powered by Lemon Squeezy</span>
              </div>
            </div>
          </div>

          {/* Additional info */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            Your subscription will automatically renew monthly until cancelled.
          </p>
        </div>
      </main>
    </div>
  )
}
