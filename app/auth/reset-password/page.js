'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Eye, EyeOff, Check, X, Loader2, Lock, Sparkles, ArrowRight } from 'lucide-react'
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

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const passwordValidation = validatePassword(password)
  const passwordsMatch = password === confirmPassword && confirmPassword !== ''
  
  // Validate session on mount
  useEffect(() => {
    const validateSession = async () => {
      const supabase = createClient()
      
      // Check for hash fragment with access_token (from email link)
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        // Let Supabase handle the hash
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          setError('Invalid or expired reset link. Please request a new one.')
        }
      } else {
        // Check if user has a valid session from the reset flow
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError('Invalid or expired reset link. Please request a new one.')
        }
      }
      
      setIsValidating(false)
    }
    
    validateSession()
  }, [])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!passwordValidation.isValid) {
      setError('Please meet all password requirements')
      return
    }
    
    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }
    
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })
      
      if (updateError) {
        setError(updateError.message)
        return
      }
      
      setSuccess(true)
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth')
      }, 2000)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validating reset link...</p>
        </div>
      </div>
    )
  }
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          
          <h1 className="text-2xl font-semibold text-foreground mb-2">Password updated!</h1>
          <p className="text-muted-foreground mb-6">
            Your password has been successfully reset. Redirecting to sign in...
          </p>
          
          <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Founder Note</span>
        </div>
        
        <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-2">Set new password</h1>
            <p className="text-sm text-muted-foreground">
              Choose a strong password for your account
            </p>
          </div>
          
          {error && !error.includes('Invalid or expired') && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive mb-6">
              {error}
            </div>
          )}
          
          {error && error.includes('Invalid or expired') ? (
            <div className="text-center">
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 mb-6">
                <p className="text-sm text-destructive">{error}</p>
              </div>
              <Button 
                onClick={() => router.push('/auth')}
                className="h-11 px-6 rounded-xl"
              >
                Back to sign in
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-sm font-medium text-foreground/80">
                  New password
                </label>
                <PasswordInput
                  id="new-password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  error={password && !passwordValidation.isValid}
                />
                <PasswordStrength password={password} />
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-sm font-medium text-foreground/80">
                  Confirm password
                </label>
                <PasswordInput
                  id="confirm-password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  error={confirmPassword && !passwordsMatch}
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                )}
                {confirmPassword && passwordsMatch && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-1">
                    <Check className="w-3 h-3" />
                    Passwords match
                  </div>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={isLoading || !passwordValidation.isValid || !passwordsMatch}
                className="w-full h-12 rounded-xl font-medium text-base"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Update password'
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
