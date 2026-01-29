'use client'

import { useState } from 'react'
import {
  Trash2, AlertTriangle, Loader2, Shield, Database,
  XCircle, Mic, Sparkles, MessageCircle, RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

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
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const resetAllStates = () => {
    setShowClearConfirm(false)
    setShowDeleteConfirm(false)
    setShowCancelConfirm(false)
    setDeleteConfirmText('')
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
    try {
      await onCancelSubscription()
    } catch (error) {
      console.error('Cancel subscription error:', error)
      setIsCancelling(false)
    }
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User'
  const initial = (displayName[0] || user?.email?.[0] || 'U').toUpperCase()
  const isMainView = !showClearConfirm && !showDeleteConfirm && !showCancelConfirm

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
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase tracking-wider flex-shrink-0">
                    Beta
                  </span>
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
                    <p className="text-sm font-semibold text-foreground">Beta Plan</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Early adopter pricing, locked in</p>
                  </div>
                  <span className="text-xs text-primary font-semibold">$14.99/mo</span>
                </div>
                {onCancelSubscription && (
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
                    <li>Your subscription and billing</li>
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
