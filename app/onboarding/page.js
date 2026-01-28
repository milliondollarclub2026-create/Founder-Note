'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, Check, ArrowRight, Brain, Lightbulb, MessageSquare, Users, Briefcase, Heart, ListChecks, Quote, AlertTriangle, FileText, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Create Supabase client
const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Usage Options for Question 1 — concise, no descriptions
const usageOptions = [
  { id: 'ideas', label: 'Ideas & brain dumps', icon: Brain },
  { id: 'meetings', label: 'Meeting notes', icon: MessageSquare },
  { id: 'decisions', label: 'Decisions & reasoning', icon: ListChecks },
  { id: 'product', label: 'Product planning', icon: Briefcase },
  { id: 'investors', label: 'Investor updates', icon: Users },
  { id: 'personal', label: 'Personal reflections', icon: Heart },
]

// AI Output Style Options for Question 2 — concise, no descriptions
const aiStyleOptions = [
  { id: 'bullets', label: 'Concise bullet points', icon: ListChecks },
  { id: 'structured', label: 'Structured summaries', icon: FileText },
  { id: 'decisions', label: 'Decisions & takeaways', icon: Lightbulb },
  { id: 'blockers', label: 'Blockers & open questions', icon: AlertTriangle },
  { id: 'minimal', label: 'Close to original wording', icon: Quote },
]

// Selectable Chip Component — compact, no description
const SelectableChip = ({ option, selected, onToggle }) => {
  const Icon = option.icon

  return (
    <button
      onClick={onToggle}
      className={`group relative w-full px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
        selected
          ? 'border-primary shadow-sm scale-[1.01]'
          : 'hover:border-primary/25'
      }`}
      style={{
        background: selected
          ? 'hsl(355 48% 39% / 0.04)'
          : 'hsl(34 40% 95%)',
        borderColor: selected ? undefined : 'hsl(34 25% 82% / 0.6)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-1.5 rounded-lg transition-colors ${
            selected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          }`}
          style={{
            background: selected ? 'hsl(355 48% 39% / 0.1)' : 'hsl(34 30% 90%)',
          }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className={`text-sm font-medium flex-1 ${selected ? 'text-foreground' : 'text-foreground/80'}`}>
          {option.label}
        </span>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          selected
            ? 'border-primary bg-primary'
            : 'border-border/50 group-hover:border-primary/30'
        }`}>
          {selected && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>
      </div>
    </button>
  )
}

// Progress Indicator
const ProgressIndicator = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center gap-2">
      {[...Array(totalSteps)].map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === currentStep
              ? 'w-8 bg-primary'
              : i < currentStep
                ? 'w-4 bg-primary/50'
                : 'w-4 bg-border'
          }`}
        />
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0) // 0 = welcome, 1 = usage, 2 = ai style
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [userName, setUserName] = useState('')
  const [slideDir, setSlideDir] = useState(null) // null = initial, 'right' = forward, 'left' = back

  // Onboarding selections
  const [usageSelections, setUsageSelections] = useState([])
  const [aiStyleSelections, setAiStyleSelections] = useState([])

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      setUser(user)

      // Get user's name from metadata
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'
      setUserName(name.split(' ')[0]) // First name only

      // Check if onboarding is already completed
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed, subscription_status')
        .eq('user_id', user.id)
        .single()

      if (profile?.onboarding_completed) {
        // If onboarded, check subscription status
        if (profile?.subscription_status === 'active') {
          router.push('/dashboard')
        } else {
          router.push('/subscribe')
        }
        return
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  // Toggle usage selection
  const toggleUsage = (id) => {
    setUsageSelections(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    )
  }

  // Toggle AI style selection
  const toggleAiStyle = (id) => {
    setAiStyleSelections(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    )
  }

  // Complete onboarding
  const completeOnboarding = async () => {
    if (!user) return

    setIsSaving(true)

    try {
      const supabase = createClient()

      // Upsert profile — handles both "row exists" and "row missing" cases
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name || '',
          email: user.email,
          onboarding_completed: true,
          usage_preferences: usageSelections,
          ai_style_preferences: aiStyleSelections,
        }, { onConflict: 'user_id' })

      if (error) {
        console.error('Failed to save onboarding:', error)
        setIsSaving(false)
        return
      }

      // Verify the write landed before navigating
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single()

      if (!profile?.onboarding_completed) {
        console.error('Onboarding flag not persisted after write')
        setIsSaving(false)
        return
      }

      // Navigate to paywall (subscription required before dashboard access)
      router.push('/subscribe')
    } catch (error) {
      console.error('Failed to save onboarding:', error)
      setIsSaving(false)
    }
  }

  // Handle next step
  const handleNext = () => {
    setSlideDir('right')
    if (step < 2) {
      setStep(step + 1)
    } else {
      completeOnboarding()
    }
  }

  // Handle going back
  const goBack = (targetStep) => {
    setSlideDir('left')
    setStep(targetStep)
  }

  // Check if can proceed
  const canProceed = () => {
    if (step === 0) return true
    if (step === 1) return usageSelections.length > 0
    if (step === 2) return aiStyleSelections.length > 0
    return false
  }

  // Step animation class — initial load fades in, navigation slides
  const stepAnimation = slideDir === null
    ? 'animate-fade-in'
    : slideDir === 'right'
      ? 'animate-slide-in-right'
      : 'animate-slide-in-left'

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, hsl(34 42% 92%) 0%, hsl(34 35% 89%) 50%, hsl(34 40% 91%) 100%)' }}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Preparing your experience...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, hsl(34 42% 92%) 0%, hsl(34 35% 89%) 50%, hsl(34 40% 91%) 100%)' }}
    >
      {/* Top-left logo */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-2.5">
        <img src="/logo.png" alt="Founder Note" width={40} height={40} className="w-10 h-10 rounded-xl shadow-sm" />
        <span className="text-xl font-bold tracking-[-0.01em]">Founder Note</span>
      </div>

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
          className="absolute top-[55%] left-[10%] w-72 h-72 rounded-full blur-[80px] auth-orb-3"
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

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress */}
        <div className="flex justify-center mb-8">
          <ProgressIndicator currentStep={step} totalSteps={3} />
        </div>

        {/* Content Card */}
        <div
          className="rounded-2xl border shadow-lg overflow-hidden"
          style={{
            background: 'hsl(34 45% 96%)',
            borderColor: 'hsl(34 30% 80%)',
            boxShadow: '0 8px 32px -8px hsl(355 48% 39% / 0.08), 0 2px 6px hsl(34 30% 50% / 0.1)',
          }}
        >
          <div key={step} className={stepAnimation}>
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="p-8 md:p-12 text-center">
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-3 tracking-[-0.01em]">
                  Welcome, {userName}
                </h1>

                <p className="text-muted-foreground text-base md:text-lg mb-10 max-w-md mx-auto leading-relaxed">
                  A few quick questions to shape your experience.
                </p>

                <Button
                  size="lg"
                  onClick={handleNext}
                  className="h-12 px-8 rounded-xl font-medium text-base"
                >
                  {"Let's go"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 1: Usage Preferences */}
            {step === 1 && (
              <div className="p-8 md:p-10">
                <div className="text-center mb-8">
                  <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2 tracking-[-0.01em]">
                    What do you want to capture?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Select all that apply
                  </p>
                </div>

                <div className="grid gap-3 mb-8">
                  {usageOptions.map((option, i) => (
                    <div key={option.id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                      <SelectableChip
                        option={option}
                        selected={usageSelections.includes(option.id)}
                        onToggle={() => toggleUsage(option.id)}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => goBack(0)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back
                  </button>
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="h-11 px-6 rounded-xl"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: AI Style Preferences */}
            {step === 2 && (
              <div className="p-8 md:p-10">
                <div className="text-center mb-8">
                  <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2 tracking-[-0.01em]">
                    How should AI help you?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred output styles
                  </p>
                </div>

                <div className="grid gap-3 mb-8">
                  {aiStyleOptions.map((option, i) => (
                    <div key={option.id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                      <SelectableChip
                        option={option}
                        selected={aiStyleSelections.includes(option.id)}
                        onToggle={() => toggleAiStyle(option.id)}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => goBack(1)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back
                  </button>
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed() || isSaving}
                    className="h-11 px-6 rounded-xl"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        Start using Founder Note
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Skip option */}
        {step > 0 && (
          <div className="text-center mt-6">
            <button
              onClick={completeOnboarding}
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
