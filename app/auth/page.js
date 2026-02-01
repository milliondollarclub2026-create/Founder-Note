'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Eye, EyeOff, Check, X, Loader2, Lock, Mail, User, ArrowLeft, ArrowRight, Chrome } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

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
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsl(355 48% 39% / 0.12) 0%, hsl(34 38% 92% / 0.9) 40%, hsl(355 48% 39% / 0.06) 100%)'
      }}
    >
      {/* Concentric expanding rings from center */}
      <div className="absolute inset-0">
        <div className="auth-ring auth-ring-1" />
        <div className="auth-ring auth-ring-2" />
        <div className="auth-ring auth-ring-3" />
        <div className="auth-ring auth-ring-4" />
        <div className="auth-ring auth-ring-5" />
        <div className="auth-ring auth-ring-6" />
      </div>

      {/* Warm garnet orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-12 left-12 w-80 h-80 rounded-full blur-[80px] auth-orb-1"
          style={{ background: 'hsl(355 48% 39% / 0.25)' }} />
        <div className="absolute bottom-16 right-8 w-[28rem] h-[28rem] rounded-full blur-[100px] auth-orb-2"
          style={{ background: 'hsl(355 48% 50% / 0.18)' }} />
        <div className="absolute top-[40%] left-[25%] w-56 h-56 rounded-full blur-[60px] auth-orb-3"
          style={{ background: 'hsl(25 45% 50% / 0.18)' }} />
      </div>

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(355 48% 39%) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center px-16 max-w-lg mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl font-semibold text-foreground mb-4 leading-tight tracking-[-0.01em]">
            Speak your ideas.<br />
            <span className="text-primary/80">{"We'll organize them."}</span>
          </h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed max-w-sm">
            Built for founders who think faster than they type.
          </p>
        </div>

        {/* Feature highlights — specific, concrete */}
        <div className="space-y-4">
          {[
            'Record a thought, get back structured notes',
            'AI summaries and key points, instantly',
            'Search and chat across everything you capture',
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-foreground/75 animate-fade-in" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'backwards' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'hsl(355 48% 39% / 0.1)' }}
              >
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
        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${validation.minLength ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground/50'}`}>
          {validation.minLength ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
        </div>
        <span className={validation.minLength ? 'text-primary' : 'text-muted-foreground/60'}>
          At least 8 characters
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${validation.hasNumber ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground/50'}`}>
          {validation.hasNumber ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
        </div>
        <span className={validation.hasNumber ? 'text-primary' : 'text-muted-foreground/60'}>
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
        <h1 className="text-2xl font-semibold text-foreground mb-2 tracking-[-0.01em]">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue
        </p>
      </div>

      {/* Google Sign In */}
      <Button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onGoogleSignIn()
        }}
        disabled={isLoading}
        variant="outline"
        className="w-full h-14 rounded-xl text-base font-medium border-2 gap-3 transition-all duration-200"
        style={{
          background: 'hsl(34 45% 97%)',
          borderColor: 'hsl(34 30% 76%)',
          boxShadow: '0 1px 3px hsl(34 30% 50% / 0.12)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'hsl(355 48% 39% / 0.35)'
          e.currentTarget.style.boxShadow = '0 4px 14px -2px hsl(355 48% 39% / 0.14)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'hsl(34 30% 76%)'
          e.currentTarget.style.boxShadow = '0 1px 3px hsl(34 30% 50% / 0.12)'
        }}
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
          <span className="px-3 text-muted-foreground/60" style={{ background: 'hsl(34 45% 96%)' }}>or</span>
        </div>
      </div>

      {/* Email Sign In - Secondary with darker default, garnet on hover */}
      <Button
        onClick={onEmailSignIn}
        variant="outline"
        className="w-full h-12 rounded-xl text-sm font-medium gap-2 transition-all duration-200 border-border/60"
        style={{
          background: 'hsl(355 30% 25%)',
          color: 'hsl(34 38% 95%)',
          borderColor: 'hsl(355 30% 20%)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'hsl(355 48% 39%)'
          e.currentTarget.style.borderColor = 'hsl(355 48% 35%)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'hsl(355 30% 25%)'
          e.currentTarget.style.borderColor = 'hsl(355 30% 20%)'
        }}
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
          setError('Your email hasn\'t been verified yet. Check your inbox for the confirmation link.')
        } else if (authError.message.includes('Invalid login credentials')) {
          // Check if the email exists to give a specific message
          try {
            const res = await fetch('/api/auth/check-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            })
            const { exists } = await res.json()
            if (!exists) {
              setError('No account found with this email. Please sign up first.')
            } else {
              setError('Incorrect password. Please try again.')
            }
          } catch {
            setError('Incorrect email or password. Please try again.')
          }
        } else {
          setError(authError.message)
        }
        return
      }
      
      // Check profile status — trigger auto-creates profiles on signup,
      // but use maybeSingle() in case it hasn't propagated yet
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (!profile || !profile.onboarding_completed) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
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
        <h2 className="text-2xl font-semibold text-foreground mb-2 tracking-[-0.01em]">Sign in with email</h2>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive mb-6 animate-fade-in">
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
              className="text-xs text-primary/80 hover:text-primary font-medium transition-colors"
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
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing in...
            </span>
          ) : 'Sign in'}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center mt-6">
        {"New here? "}
        <button
          onClick={onSignupSwitch}
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Create an account
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
  const [agreedToTerms, setAgreedToTerms] = useState(false)
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
          setError('An account with this email already exists. Try signing in.')
        } else {
          setError(authError.message)
        }
        return
      }

      // Supabase returns a fake user with empty identities and no
      // confirmation_sent_at when the email is already registered
      // (to prevent email enumeration). A genuine new signup will
      // have identities or a confirmation_sent_at timestamp.
      if (data?.user?.identities?.length === 0 && !data?.user?.confirmation_sent_at) {
        setError('An account with this email already exists. Try signing in.')
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
        <h2 className="text-2xl font-semibold text-foreground mb-2 tracking-[-0.01em]">Create your account</h2>
        <p className="text-sm text-muted-foreground">
          Your best ideas start as spoken words.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive mb-6 animate-fade-in">
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

        <label className="flex items-start gap-3 cursor-pointer mt-2">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border/50 accent-primary cursor-pointer"
          />
          <span className="text-xs text-muted-foreground leading-relaxed">
            I agree to the{' '}
            <Link href="/terms" target="_blank" className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
              Terms & Conditions
            </Link>{' '}
            and{' '}
            <Link href="/privacy" target="_blank" className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
              Privacy Policy
            </Link>
          </span>
        </label>

        <Button
          type="submit"
          disabled={isLoading || !passwordValidation.isValid || !agreedToTerms}
          className="w-full h-12 rounded-xl font-medium text-base mt-2"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating account...
            </span>
          ) : 'Create account'}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center mt-6">
        Already have an account?{' '}
        <button
          onClick={onLoginSwitch}
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Sign in instead
        </button>
      </p>
    </div>
  )
}

// Email Verification Sent View
const VerificationSentView = ({ email, onBackToLogin }) => {
  return (
    <div className="text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: 'hsl(355 48% 39% / 0.08)' }}
      >
        <Mail className="w-8 h-8 text-primary" />
      </div>

      <h2 className="text-2xl font-semibold text-foreground mb-2 tracking-[-0.01em]">Check your inbox</h2>
      <p className="text-muted-foreground mb-2">
        {"We've sent a verification link to"}
      </p>
      <p className="text-foreground font-medium mb-6">{email}</p>

      <div className="p-4 rounded-xl border mb-6"
        style={{ background: 'hsl(34 30% 93% / 0.5)', borderColor: 'hsl(34 25% 82% / 0.6)' }}
      >
        <p className="text-sm text-muted-foreground">
          Click the link in the email to verify your account.
        </p>
      </div>

      <p className="text-xs text-muted-foreground/60 mb-4">
        {"Don't see it? Check your spam or promotions folder."}
      </p>

      <button
        onClick={onBackToLogin}
        className="text-sm text-primary/80 hover:text-primary font-medium transition-colors"
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
        <h2 className="text-2xl font-semibold text-foreground mb-2 tracking-[-0.01em]">Reset your password</h2>
        <p className="text-sm text-muted-foreground">
          {"Enter your email and we'll send a reset link."}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive mb-6 animate-fade-in">
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
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </span>
          ) : 'Send reset link'}
        </Button>
      </form>
    </div>
  )
}

// Reset Sent View
const ResetSentView = ({ email, onBackToLogin }) => {
  return (
    <div className="text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: 'hsl(355 48% 39% / 0.08)' }}
      >
        <Check className="w-8 h-8 text-primary" />
      </div>

      <h2 className="text-2xl font-semibold text-foreground mb-2 tracking-[-0.01em]">Reset link sent</h2>
      <p className="text-muted-foreground mb-2">
        {"We've sent a password reset link to"}
      </p>
      <p className="text-foreground font-medium mb-6">{email}</p>

      <div className="p-4 rounded-xl border mb-6"
        style={{ background: 'hsl(34 30% 93% / 0.5)', borderColor: 'hsl(34 25% 82% / 0.6)' }}
      >
        <p className="text-sm text-muted-foreground">
          Click the link in the email to set a new password. The link expires in 24 hours.
        </p>
      </div>

      <button
        onClick={onBackToLogin}
        className="text-sm text-primary/80 hover:text-primary font-medium transition-colors"
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
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Navigate with direction tracking
  const navigateTo = (newView, direction = 'forward') => {
    setViewDirection(direction)
    setView(newView)
  }

  const viewAnimClass = viewDirection === 'back' ? 'animate-slide-in-left' : 'animate-slide-in-right'
  
  // Check for error/success params from redirects
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const verifiedParam = searchParams.get('verified')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
    if (verifiedParam === 'true') {
      setSuccessMessage('Email verified successfully. Please sign in to continue.')
      // Switch to the email login view
      setView('email-login')
    }
  }, [searchParams])
  
  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        toast.error('Failed to sign in with Google. Please try again.')
        console.error('Google sign in error:', error)
      }
    } catch (err) {
      toast.error('Failed to sign in with Google. Please try again.')
      console.error('Google sign in error:', err)
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
    <div className="min-h-screen flex bg-background relative">
      {/* Top-left logo — fixed across the full screen */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-2.5">
        <img src="/logo.png" alt="Founder Note" width={40} height={40} className="w-10 h-10 rounded-xl shadow-sm" />
        <span className="text-xl font-bold tracking-[-0.01em]">Founder Note</span>
      </div>

      {/* Brand Panel */}
      <BrandPanel />

      {/* Auth Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 pt-20 relative"
        style={{ background: 'linear-gradient(180deg, hsl(34 42% 92%) 0%, hsl(34 35% 89%) 100%)' }}
      >
        {/* Back to landing */}
        <Link
          href="/"
          className="absolute top-7 left-7 lg:left-auto lg:right-7 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="w-full max-w-md">
          {/* Success message (e.g. email verified) */}
          {successMessage && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-foreground mb-6 animate-fade-in">
              {successMessage}
            </div>
          )}

          {/* Error display */}
          {error && view === 'main' && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive mb-6">
              {error}
            </div>
          )}

          {/* Auth Card */}
          <div className="rounded-2xl border shadow-lg p-8 overflow-hidden"
            style={{
              background: 'hsl(34 45% 96%)',
              borderColor: 'hsl(34 30% 80%)',
              boxShadow: '0 8px 32px -8px hsl(355 48% 39% / 0.08), 0 2px 6px hsl(34 30% 50% / 0.1)'
            }}
          >
            {view === 'main' && (
              <MainEntryView
                onGoogleSignIn={handleGoogleSignIn}
                onEmailSignIn={() => navigateTo('email-login', 'forward')}
                isLoading={false}
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
