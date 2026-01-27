'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, Sparkles, Check, ArrowRight, Brain, Lightbulb, MessageSquare, Users, Briefcase, Heart, ListChecks, Quote, AlertTriangle, FileText, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Create Supabase client
const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Usage Options for Question 1
const usageOptions = [
  { 
    id: 'ideas', 
    label: 'Ideas & brain dumps', 
    icon: Brain,
    description: 'Quick thoughts and creative captures'
  },
  { 
    id: 'meetings', 
    label: 'Meeting & call notes', 
    icon: MessageSquare,
    description: 'Recording and summarizing conversations'
  },
  { 
    id: 'decisions', 
    label: 'Decisions & reasoning', 
    icon: ListChecks,
    description: 'Documenting why you chose what you chose'
  },
  { 
    id: 'product', 
    label: 'Product & engineering planning', 
    icon: Briefcase,
    description: 'Specs, roadmaps, and technical thinking'
  },
  { 
    id: 'investors', 
    label: 'Investor & stakeholder thoughts', 
    icon: Users,
    description: 'Fundraising prep and board updates'
  },
  { 
    id: 'personal', 
    label: 'Personal life organization', 
    icon: Heart,
    description: 'Non-work thoughts and reflections'
  },
]

// AI Output Style Options for Question 2
const aiStyleOptions = [
  { 
    id: 'bullets', 
    label: 'Concise bullet points only', 
    icon: ListChecks,
    description: 'Quick, scannable takeaways'
  },
  { 
    id: 'structured', 
    label: 'Structured summaries', 
    icon: FileText,
    description: 'Organized with headings and sections'
  },
  { 
    id: 'decisions', 
    label: 'Highlight decisions & takeaways', 
    icon: Lightbulb,
    description: 'Focus on what was decided'
  },
  { 
    id: 'blockers', 
    label: 'Surface blockers & open questions', 
    icon: AlertTriangle,
    description: 'Identify what needs resolution'
  },
  { 
    id: 'minimal', 
    label: 'Keep close to original wording', 
    icon: Quote,
    description: 'Minimal AI transformation'
  },
]

// Selectable Chip Component
const SelectableChip = ({ option, selected, onToggle, showDescription = true }) => {
  const Icon = option.icon
  
  return (
    <button
      onClick={onToggle}
      className={`group relative w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
        selected 
          ? 'border-primary bg-primary/5 shadow-sm' 
          : 'border-border/50 bg-card hover:border-primary/30 hover:bg-secondary/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg transition-colors ${
          selected ? 'bg-primary/10 text-primary' : 'bg-secondary/50 text-muted-foreground group-hover:text-foreground'
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${selected ? 'text-foreground' : 'text-foreground/80'}`}>
              {option.label}
            </span>
          </div>
          {showDescription && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {option.description}
            </p>
          )}
        </div>
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
          router.push('/')
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
      
      // Update existing profile with onboarding preferences
      // Profile was created during login/callback, now we just update it
      const { error } = await supabase
        .from('user_profiles')
        .update({
          onboarding_completed: true,
          usage_preferences: usageSelections,
          ai_style_preferences: aiStyleSelections,
        })
        .eq('user_id', user.id)
      
      if (error) {
        console.error('Error saving preferences:', error)
        // If update fails, try to insert (fallback for edge cases)
        const { error: insertError } = await supabase.from('user_profiles').insert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name,
          email: user.email,
          onboarding_completed: true,
          usage_preferences: usageSelections,
          ai_style_preferences: aiStyleSelections,
        })
        
        if (insertError) {
          console.error('Insert also failed:', insertError)
        }
      }
      
      // Navigate to paywall (subscription required before dashboard access)
      router.push('/subscribe')
    } catch (error) {
      console.error('Failed to save onboarding:', error)
      // Still navigate to paywall even if save fails
      router.push('/subscribe')
    }
  }
  
  // Handle next step
  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1)
    } else {
      completeOnboarding()
    }
  }
  
  // Check if can proceed
  const canProceed = () => {
    if (step === 0) return true
    if (step === 1) return usageSelections.length > 0
    if (step === 2) return aiStyleSelections.length > 0
    return false
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Preparing your experience...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex justify-center mb-8">
          <ProgressIndicator currentStep={step} totalSteps={3} />
        </div>
        
        {/* Content Card */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="p-8 md:p-12 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Welcome, {userName}!
              </h1>
              
              <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-md mx-auto leading-relaxed">
                Let's personalize Founder Note for how you think and work. This takes about 30 seconds.
              </p>
              
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 mb-8 max-w-sm mx-auto">
                <p className="text-sm text-muted-foreground">
                  Your answers help us tune AI summaries, Brain Dump groupings, and how the assistant responds.
                </p>
              </div>
              
              <Button 
                size="lg" 
                onClick={handleNext}
                className="h-12 px-8 rounded-xl font-medium text-base"
              >
                Let's go
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
          
          {/* Step 1: Usage Preferences */}
          {step === 1 && (
            <div className="p-8 md:p-10 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
                  What do you want to capture?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Select all that apply — this shapes how we organize and surface your notes
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
                  onClick={() => setStep(0)}
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
            <div className="p-8 md:p-10 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
                  How should AI help you?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred output styles — affects summaries, insights, and assistant behavior
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
                  onClick={() => setStep(1)}
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
                      <Sparkles className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
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
