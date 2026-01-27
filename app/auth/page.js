'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Eye, EyeOff, Check, X, Loader2, Lock, Mail, User, Sparkles, ArrowLeft, ArrowRight, Chrome } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Create Supabase client
const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Password validation rules
const validatePassword = (password) => {
  return {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    isValid: password.length >= 8 && /\d/.test(password)
  }
}

// Google Icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

// Brand Panel - Left side of auth page
const BrandPanel = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
      {/* Floating orbs with slow drift animation */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-32 right-16 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float-slow-delayed" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-primary/8 rounded-full blur-2xl animate-float-slow-delayed-2" />
      </div>

      {/* Subtle dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(355 48% 39%) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Content with glass effect */}
      <div className="relative z-10 flex flex-col justify-center px-16 max-w-lg mx-auto">
        <div className="mb-8 backdrop-blur-[2px]">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 backdrop-blur-sm border border-primary/10 shadow-sm">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-3xl font-semibold text-foreground/90 mb-4 leading-tight">
            Capture your thoughts,<br />let AI do the rest.
          </h2>
          <p className="text-base text-muted-foreground/70 leading-relaxed">
            Voice notes that transform into organized insights. Built for founders who think fast and build faster.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="space-y-4">
          {[
            'One-tap voice capture',
            'AI-powered summaries & insights',
            'Smart organization with tags & folders',
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-foreground/70" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-primary" />
              </div>
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Password Input with visibility toggle
const PasswordInput = ({ value, onChange, placeholder, id, name, autoComplete, error }) => {
  const [showPassword, setShowPassword] = useState(false)
  
  return (
    <div className="relative">
      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
      <Input
        type={showPassword ? 'text' : 'password'}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`pl-11 pr-11 h-12 rounded-xl border-border/50 bg-secondary/30 focus:bg-background focus:border-primary/50 transition-all ${error ? 'border-destructive/50 focus:border-destructive' : ''}`}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        tabIndex={-1}
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

// Password strength indicator
const PasswordStrength = ({ password }) => {
  const validation = validatePassword(password)
  
  if (!password) return null
  
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-2 text-xs">
        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${validation.minLength ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground/50'}`}>
          {validation.minLength ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
        </div>
        <span className={validation.minLength ? 'text-emerald-600' : 'text-muted-foreground/60'}>
          At least 8 characters
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${validation.hasNumber ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground/50'}`}>
          {validation.hasNumber ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
        </div>
        <span className={validation.hasNumber ? 'text-emerald-600' : 'text-muted-foreground/60'}>
          At least 1 number
        </span>
      </div>
    </div>
  )
}

// Main Entry View - Google primary, Email secondary
const MainEntryView = ({ onGoogleSignIn, onEmailSignIn, isLoading }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Welcome to Founder Note</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to start capturing your thoughts
        </p>
      </div>
      
      {/* Google Sign In - Primary CTA */}
      <Button
        onClick={onGoogleSignIn}
        disabled={isLoading}
        variant="outline"
        className="w-full h-14 rounded-xl text-base font-medium border-2 border-border bg-card shadow-sm hover:border-primary/30 hover:shadow-md hover:bg-card transition-all gap-3"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </Button>
      
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground/60">or</span>
        </div>
      </div>
      
      {/* Email Sign In - Secondary */}
      <Button
        onClick={onEmailSignIn}
        variant="ghost"
        className="w-full h-12 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all gap-2"
      >
        <Mail className="w-4 h-4" />
        Sign in with email
      </Button>
      
      {/* Privacy note */}
      <p className="text-[11px] text-muted-foreground/50 text-center leading-relaxed">
        By continuing, you agree to our{' '}
        <span className="underline underline-offset-2 text-muted-foreground/70 hover:text-primary cursor-pointer transition-colors">Terms of Service</span>
        {' '}and{' '}
        <span className="underline underline-offset-2 text-muted-foreground/70 hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>.
        We only access your email for authentication.
      </p>
    </div>
  )
}

// Email Login Form
const EmailLoginForm = ({ onBack, onForgotPassword, onSignupSwitch, animClass = 'animate-fade-in' }) => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          setError('Please verify your email before logging in. Check your inbox.')
        } else if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else {
          setError(authError.message)
        }
        return
      }
      
      // Check if profile exists, create if not
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', data.user.id)
        .single()
      
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        await supabase.from('user_profiles').insert({
          user_id: data.user.id,
          full_name: data.user.user_metadata?.full_name || '',
          email: data.user.email,
          onboarding_completed: false,
        })
        router.push('/onboarding')
      } else if (!profile?.onboarding_completed) {
        router.push('/onboarding')
      } else {
        router.push('/')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className={animClass}>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Sign in with email</h2>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to continue
        </p>
      </div>
      
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground/80">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="pl-11 h-12 rounded-xl border-border/50 bg-secondary/30 focus:bg-background focus:border-primary/50 transition-all"
            />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground/80">Password</label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <PasswordInput
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>
        
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl font-medium text-base mt-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
        </Button>
      </form>
      
      <p className="text-sm text-muted-foreground text-center mt-6">
        {"Don't have an account? "}
        <button
          onClick={onSignupSwitch}
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Sign up
        </button>
      </p>
    </div>
  )
}

// Email Signup Form
const EmailSignupForm = ({ onBack, onLoginSwitch, onSuccess, animClass = 'animate-fade-in' }) => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const passwordValidation = validatePassword(password)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!passwordValidation.isValid) {
      setError('Please meet all password requirements')
      return
    }
    
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('An account with this email already exists. Try logging in.')
        } else {
          setError(authError.message)
        }
        return
      }
      
      onSuccess(email)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className={animClass}>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Create your account</h2>
        <p className="text-sm text-muted-foreground">
          Start capturing your thoughts in seconds
        </p>
      </div>
      
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-foreground/80">Full name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              type="text"
              id="name"
              name="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              required
              className="pl-11 h-12 rounded-xl border-border/50 bg-secondary/30 focus:bg-background focus:border-primary/50 transition-all"
            />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="text-sm font-medium text-foreground/80">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              type="email"
              id="signup-email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="pl-11 h-12 rounded-xl border-border/50 bg-secondary/30 focus:bg-background focus:border-primary/50 transition-all"
            />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label htmlFor="signup-password" className="text-sm font-medium text-foreground/80">Password</label>
          <PasswordInput
            id="signup-password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            autoComplete="new-password"
            error={password && !passwordValidation.isValid}
          />
          <PasswordStrength password={password} />
        </div>
        
        <Button
          type="submit"
          disabled={isLoading || !passwordValidation.isValid}
          className="w-full h-12 rounded-xl font-medium text-base mt-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create account'}
        </Button>
      </form>
      
      <p className="text-sm text-muted-foreground text-center mt-6">
        Already have an account?{' '}
        <button
          onClick={onLoginSwitch}
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Sign in
        </button>
      </p>
    </div>
  )
}

// Email Verification Sent View
const VerificationSentView = ({ email, onBackToLogin }) => {
  return (
    <div className="text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Mail className="w-8 h-8 text-primary" />
      </div>
      
      <h2 className="text-2xl font-semibold text-foreground mb-2">Check your email</h2>
      <p className="text-muted-foreground mb-2">
        {"We've sent a verification link to"}
      </p>
      <p className="text-foreground font-medium mb-6">{email}</p>
      
      <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 mb-6">
        <p className="text-sm text-muted-foreground">
          Click the link in the email to verify your account and get started.
        </p>
      </div>
      
      <p className="text-xs text-muted-foreground/60 mb-4">
          {"Didn't receive the email? Check your spam folder."}
      </p>
      
      <button
        onClick={onBackToLogin}
        className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
      >
        Back to sign in
      </button>
    </div>
  )
}

// Forgot Password Form
const ForgotPasswordForm = ({ onBack, onSuccess, animClass = 'animate-fade-in' }) => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      
      if (resetError) {
        setError(resetError.message)
        return
      }
      
      onSuccess(email)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className={animClass}>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Reset your password</h2>
        <p className="text-sm text-muted-foreground">
          {"Enter your email and we'll send you a reset link."}
        </p>
      </div>
      
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="reset-email" className="text-sm font-medium text-foreground/80">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              type="email"
              id="reset-email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="pl-11 h-12 rounded-xl border-border/50 bg-secondary/30 focus:bg-background focus:border-primary/50 transition-all"
            />
          </div>
        </div>
        
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl font-medium text-base"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send reset link'}
        </Button>
      </form>
    </div>
  )
}

// Reset Sent View
const ResetSentView = ({ email, onBackToLogin }) => {
  return (
    <div className="text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Check className="w-8 h-8 text-primary" />
      </div>
      
      <h2 className="text-2xl font-semibold text-foreground mb-2">Check your email</h2>
      <p className="text-muted-foreground mb-2">
        {"We've sent a password reset link to"}
      </p>
      <p className="text-foreground font-medium mb-6">{email}</p>
      
      <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 mb-6">
        <p className="text-sm text-muted-foreground">
          Click the link in the email to reset your password. The link expires in 24 hours.
        </p>
      </div>
      
      <button
        onClick={onBackToLogin}
        className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
      >
        Back to sign in
      </button>
    </div>
  )
}

// Main Auth Page Component with Suspense boundary
function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [view, setView] = useState('main') // main, email-login, email-signup, verification, forgot, reset-sent
  const [viewDirection, setViewDirection] = useState('forward') // forward or back
  const [verificationEmail, setVerificationEmail] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  // Navigate with direction tracking
  const navigateTo = (newView, direction = 'forward') => {
    setViewDirection(direction)
    setView(newView)
  }

  const viewAnimClass = viewDirection === 'back' ? 'animate-slide-in-left' : 'animate-slide-in-right'
  
  // Check for error params from redirects
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])
  
  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError('')
    
    try {
      const supabase = createClient()
      
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events',
          ].join(' '),
        },
      })
      
      if (authError) {
        setError(authError.message)
        setIsGoogleLoading(false)
        return
      }
      
      // Redirect happens automatically
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.')
      setIsGoogleLoading(false)
    }
  }
  
  const handleSignupSuccess = (email) => {
    setVerificationEmail(email)
    setView('verification')
  }
  
  const handleResetSuccess = (email) => {
    setResetEmail(email)
    setView('reset-sent')
  }
  
  return (
    <div className="min-h-screen flex bg-background">
      {/* Brand Panel */}
      <BrandPanel />
      
      {/* Auth Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Founder Note</span>
          </div>
          
          {/* Error display */}
          {error && view === 'main' && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive mb-6">
              {error}
            </div>
          )}
          
          {/* Auth Card */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-8 overflow-hidden">
            {view === 'main' && (
              <MainEntryView
                onGoogleSignIn={handleGoogleSignIn}
                onEmailSignIn={() => navigateTo('email-login', 'forward')}
                isLoading={isGoogleLoading}
              />
            )}

            {view === 'email-login' && (
              <EmailLoginForm
                onBack={() => navigateTo('main', 'back')}
                onForgotPassword={() => navigateTo('forgot', 'forward')}
                onSignupSwitch={() => navigateTo('email-signup', 'forward')}
                animClass={viewAnimClass}
              />
            )}

            {view === 'email-signup' && (
              <EmailSignupForm
                onBack={() => navigateTo('main', 'back')}
                onLoginSwitch={() => navigateTo('email-login', 'back')}
                onSuccess={handleSignupSuccess}
                animClass={viewAnimClass}
              />
            )}

            {view === 'verification' && (
              <VerificationSentView
                email={verificationEmail}
                onBackToLogin={() => navigateTo('main', 'back')}
              />
            )}

            {view === 'forgot' && (
              <ForgotPasswordForm
                onBack={() => navigateTo('email-login', 'back')}
                onSuccess={handleResetSuccess}
                animClass={viewAnimClass}
              />
            )}

            {view === 'reset-sent' && (
              <ResetSentView
                email={resetEmail}
                onBackToLogin={() => navigateTo('main', 'back')}
              />
            )}
          </div>
        </div>
      </div>
      
    </div>
  )
}

// Wrap with Suspense for useSearchParams
export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  )
}
