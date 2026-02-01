'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Trash2, AlertTriangle, Loader2, Shield, Database,
  XCircle, Mic, Sparkles, MessageCircle, RotateCcw,
  ArrowUpRight, Crown, Check, Calendar, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

const PLAN_DETAILS = {
  pro: {
    name: 'Pro',
    price: '$14.99',
    notes: 15,
    minutes: 150,
    features: ['15 notes per month', '150 min transcription', 'AI summaries & key points', 'Brain Dump synthesis', 'Remy AI assistant', 'Tags & folders'],
  },
  plus: {
    name: 'Plus',
    price: '$24.99',
    notes: 30,
    minutes: 300,
    features: ['30 notes per month', '300 min transcription', 'AI summaries & key points', 'Brain Dump synthesis', 'Advanced Remy AI', 'Tags & folders', 'Google Calendar integration', 'Priority support'],
  },
}

const UsageBar = ({ label, used, total, unit, percent, warning }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[11px] text-muted-foreground tracking-wide">{label}</span>
      <span className="text-[11px] font-medium tabular-nums">
        {used}{unit ? '' : ''} <span className="text-muted-foreground/60">/ {total}{unit ? ` ${unit}` : ''}</span>
      </span>
    </div>
    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${Math.min(percent, 100)}%`,
          backgroundColor:
            percent >= 90 ? 'hsl(0 84% 60%)'
            : percent >= 80 ? 'hsl(38 92% 50%)'
            : 'hsl(var(--primary))',
        }}
      />
    </div>
    {warning && (
      <p className="text-[10px] text-destructive mt-1 font-medium">{warning}</p>
    )}
  </div>
)

export const SettingsModal = ({ open, onClose, user, profile, usage, onClearData, onDeleteAccount, onCancelSubscription }) => {
  const router = useRouter()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false)
  const [targetUpgradePlan, setTargetUpgradePlan] = useState(null)
  const [isClearing, setIsClearing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const currentPlan = usage?.plan?.name || 'free'

  const resetAllStates = () => {
    setShowClearConfirm(false)
    setShowDeleteConfirm(false)
    setShowCancelConfirm(false)
    setShowUpgradeConfirm(false)
    setTargetUpgradePlan(null)
    setUpgradeError(null)
    setDeleteConfirmText('')
  }

  const handleUpgradeClick = (targetPlan) => {
    setTargetUpgradePlan(targetPlan)
    setUpgradeError(null)
    setShowUpgradeConfirm(true)
  }

  const handleUpgradeConfirm = async () => {
    if (!targetUpgradePlan) return

    // For free users, redirect to checkout
    if (currentPlan === 'free') {
      onClose()
      router.push(`/subscribe?plan=${targetUpgradePlan}`)
      return
    }

    // For existing subscribers, use the upgrade API
    setIsUpgrading(true)
    setUpgradeError(null)

    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPlan: targetUpgradePlan }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade subscription')
      }

      if (data.action === 'checkout') {
        // Redirect to checkout if needed
        onClose()
        router.push(data.checkoutUrl)
        return
      }

      // Success! Refresh the page to show new plan
      window.location.reload()
    } catch (error) {
      console.error('Upgrade error:', error)
      setUpgradeError(error.message)
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleClearData = async () => {
    setIsClearing(true)
    try {
      await onClearData()
      setShowClearConfirm(false)
      onClose()
    } catch (error) {
      console.error('Clear data error:', error)
    } finally {
      setIsClearing(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setIsDeleting(true)
    try {
      await onDeleteAccount()
    } catch (error) {
      console.error('Delete account error:', error)
      setIsDeleting(false)
    }
  }

  const handleCancelSubscription = async () => {
    setIsCancelling(true)

    // Safety timeout: if nothing happens after 8 seconds, reset state
    // (The parent handler has a 4s fallback redirect, so 8s means something went very wrong)
    const safetyTimer = setTimeout(() => {
      console.warn('Cancel subscription safety timeout triggered')
      setIsCancelling(false)
      setShowCancelConfirm(false)
    }, 8000)

    try {
      await onCancelSubscription()
      // If we get here, parent handled it (redirect should happen)
      clearTimeout(safetyTimer)
    } catch (error) {
      clearTimeout(safetyTimer)
      console.error('Cancel subscription error:', error)
      setIsCancelling(false)
    }
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User'
  const initial = (displayName[0] || user?.email?.[0] || 'U').toUpperCase()
  const isMainView = !showClearConfirm && !showDeleteConfirm && !showCancelConfirm && !showUpgradeConfirm

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetAllStates()
      onClose()
    }}>
      <DialogContent className="sm:max-w-[440px] gap-0 p-0 overflow-hidden">
        {/* Header band */}
        <div className="px-6 pt-6 pb-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base tracking-tight">Settings</DialogTitle>
            <DialogDescription className="text-xs">Manage your account, plan, and data</DialogDescription>
          </DialogHeader>
        </div>

        <Separator />

        {/* Main Settings View */}
        {isMainView && (
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Account */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-sm font-semibold text-primary-foreground">{initial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{displayName}</p>
                  {usage?.plan?.displayName && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase tracking-wider flex-shrink-0">
                      {usage.plan.displayName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
              </div>
            </div>

            {profile?.usage_preferences?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.usage_preferences.map((pref, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
                    {pref.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}

            <Separator />

            {/* Usage */}
            {usage && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-primary/50" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Usage</span>
                </div>
                <div className="space-y-3.5 p-3.5 rounded-xl bg-secondary/30 border border-border/50">
                  <UsageBar
                    label="Notes"
                    used={usage.notes.used}
                    total={usage.notes.limit}
                    percent={usage.notes.percent}
                    warning={usage.warnings.notesMax ? 'Limit reached' : null}
                  />
                  <UsageBar
                    label="Transcription"
                    used={usage.transcription.usedMinutes}
                    total={usage.transcription.limitMinutes}
                    unit="min"
                    percent={usage.transcription.percent}
                    warning={usage.warnings.transMax ? 'Limit reached' : null}
                  />
                  {usage.aiTokens && (
                    <div className="pt-3 border-t border-border/30">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground tracking-wide">AI Tokens</span>
                        <span className="text-[11px] font-medium tabular-nums">{usage.aiTokens.used.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Plan */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-primary/50" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan</span>
              </div>
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{usage?.plan?.displayName || 'Free'} Plan</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {currentPlan === 'free' ? 'Upgrade for more notes & minutes' :
                       currentPlan === 'pro' ? '15 notes, 150 min/month' :
                       '30 notes, 300 min/month + Google Calendar'}
                    </p>
                  </div>
                  <span className="text-xs text-primary font-semibold">
                    {currentPlan === 'free' ? 'Free' : currentPlan === 'plus' ? '$24.99/mo' : '$14.99/mo'}
                  </span>
                </div>

                {/* Upgrade options */}
                {currentPlan === 'free' && (
                  <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
                    <Button
                      onClick={() => handleUpgradeClick('pro')}
                      className="w-full h-8 text-xs gap-2"
                      size="sm"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Upgrade to Pro - $14.99/mo
                    </Button>
                    <Button
                      onClick={() => handleUpgradeClick('plus')}
                      variant="outline"
                      className="w-full h-8 text-xs gap-2"
                      size="sm"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      Upgrade to Plus - $24.99/mo
                    </Button>
                  </div>
                )}

                {currentPlan === 'pro' && (
                  <div className="mt-3 pt-3 border-t border-border/40">
                    <Button
                      onClick={() => handleUpgradeClick('plus')}
                      className="w-full h-8 text-xs gap-2"
                      size="sm"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      Upgrade to Plus - $24.99/mo
                    </Button>
                  </div>
                )}

                {onCancelSubscription && currentPlan !== 'free' && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="mt-3 pt-3 border-t border-border/40 w-full flex items-center gap-2 text-[11px] text-muted-foreground/70 hover:text-muted-foreground transition-colors group"
                  >
                    <XCircle className="w-3.5 h-3.5 group-hover:text-foreground/50 transition-colors" />
                    <span>Cancel subscription</span>
                    <span className="ml-auto text-[10px] text-muted-foreground/40">Keeps your data</span>
                  </button>
                )}
              </div>
            </div>

            <Separator />

            {/* Data & Account */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-muted-foreground/50" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data & Account</span>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full gap-2 justify-start h-9 text-xs border-border/60 text-muted-foreground hover:text-amber-700 hover:border-amber-200/60 hover:bg-amber-50/50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All Data
                  <span className="ml-auto text-[10px] text-muted-foreground/40 font-normal">Keeps account</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full gap-2 justify-start h-9 text-xs border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/20 hover:bg-destructive/5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Delete Account
                  <span className="ml-auto text-[10px] text-muted-foreground/40 font-normal">Permanent</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Confirmation */}
        {showUpgradeConfirm && targetUpgradePlan && (
          <div className="px-6 py-5 space-y-4 animate-fade-in">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Crown className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Upgrade to {PLAN_DETAILS[targetUpgradePlan]?.name}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    {PLAN_DETAILS[targetUpgradePlan]?.price}/month
                  </p>
                </div>
              </div>
            </div>

            {/* What you'll get */}
            <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                What's included
              </p>
              <ul className="space-y-2">
                {PLAN_DETAILS[targetUpgradePlan]?.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-[12px] text-foreground">
                    <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-primary" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Proration notice for existing subscribers */}
            {currentPlan !== 'free' && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-start gap-2.5">
                  <Zap className="w-3.5 h-3.5 text-primary/60 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[12px] text-foreground font-medium">Instant upgrade</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Your new plan takes effect immediately. You'll be charged the prorated difference for the remainder of your billing period.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {upgradeError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-[12px] text-destructive">{upgradeError}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpgradeConfirm(false)
                  setTargetUpgradePlan(null)
                  setUpgradeError(null)
                }}
                className="flex-1 h-9 text-xs"
                disabled={isUpgrading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpgradeConfirm}
                disabled={isUpgrading}
                className="flex-1 h-9 text-xs"
              >
                {isUpgrading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />}
                {currentPlan === 'free' ? 'Continue to Checkout' : 'Upgrade Now'}
              </Button>
            </div>
          </div>
        )}

        {/* Cancel Subscription Confirmation */}
        {showCancelConfirm && (
          <div className="px-6 py-5 space-y-4 animate-fade-in">
            <div className="p-4 rounded-xl bg-secondary/50 border border-border/60">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <XCircle className="w-4.5 h-4.5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Cancel your subscription?</p>
                  <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
                    You'll lose access to these features at the end of your billing period:
                  </p>
                  <ul className="mt-3 space-y-2">
                    <li className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
                      <Mic className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                      Voice recording & transcription
                    </li>
                    <li className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
                      <Sparkles className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                      AI processing & smart notes
                    </li>
                    <li className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
                      <MessageCircle className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                      Remy, your chat assistant
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-start gap-2.5">
                <RotateCcw className="w-3.5 h-3.5 text-primary/60 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] text-foreground font-medium">Your data is preserved</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    All your notes, transcripts, and settings stay safe. You can resubscribe anytime to pick up where you left off.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 h-9 text-xs"
                disabled={isCancelling}
              >
                Keep Subscription
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="flex-1 h-9 text-xs"
              >
                {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Cancel Subscription
              </Button>
            </div>
          </div>
        )}

        {/* Clear All Data Confirmation */}
        {showClearConfirm && (
          <div className="px-6 py-5 space-y-4 animate-fade-in">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Clear All Data?</p>
                  <p className="text-[12px] text-amber-700 mt-1.5 leading-relaxed">
                    This will permanently delete all your:
                  </p>
                  <ul className="text-[12px] text-amber-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Notes and transcripts</li>
                    <li>AI summaries and key points</li>
                    <li>Tags and folder assignments</li>
                    <li>Brain dump artifacts</li>
                    <li>Tasks and remembered items</li>
                  </ul>
                  <p className="text-[12px] text-amber-700 mt-2.5 font-medium">
                    Your account and subscription will remain active.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 h-9 text-xs"
                disabled={isClearing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearData}
                disabled={isClearing}
                className="flex-1 h-9 text-xs bg-amber-600 hover:bg-amber-700"
              >
                {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Clear All Data
              </Button>
            </div>
          </div>
        )}

        {/* Delete Account Confirmation */}
        {showDeleteConfirm && (
          <div className="px-6 py-5 space-y-4 animate-fade-in">
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-destructive">Delete Account Permanently?</p>
                  <p className="text-[12px] text-destructive/80 mt-1.5 leading-relaxed">
                    This action is <strong>irreversible</strong>. It will permanently delete:
                  </p>
                  <ul className="text-[12px] text-destructive/80 mt-2 space-y-1 list-disc list-inside">
                    <li>All your data (notes, transcripts, AI content)</li>
                    <li>Your user profile and preferences</li>
                    <li>Your subscription (will be automatically cancelled)</li>
                    <li>Your authentication account</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">
                Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">DELETE</span> to confirm:
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                className="font-mono h-9 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                className="flex-1 h-9 text-xs"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                className="flex-1 h-9 text-xs"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Delete Forever
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
