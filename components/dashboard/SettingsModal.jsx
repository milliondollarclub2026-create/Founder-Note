'use client'

import { useState } from 'react'
import { User, Trash2, AlertTriangle, LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

export const SettingsModal = ({ open, onClose, user, profile, onLogout, onClearData, onDeleteAccount }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

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
      // Will redirect to auth after deletion
    } catch (error) {
      console.error('Delete account error:', error)
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setShowClearConfirm(false)
        setShowDeleteConfirm(false)
        setDeleteConfirmText('')
      }
      onClose()
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your account and preferences</DialogDescription>
        </DialogHeader>

        {/* Main Settings View */}
        {!showClearConfirm && !showDeleteConfirm && (
          <div className="space-y-4 py-4">
            {/* User Info */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/10 border border-primary/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-foreground">
                    {(profile?.full_name || user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{profile?.full_name || user?.user_metadata?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              {profile?.usage_preferences?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Preferences</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.usage_preferences.slice(0, 3).map((pref, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {pref.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {profile.usage_preferences.length > 3 && (
                      <span className="text-[10px] text-muted-foreground/60">+{profile.usage_preferences.length - 3}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Services Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Transcription</span>
                <span className="text-xs text-muted-foreground">Deepgram Nova-2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AI Assistant</span>
                <span className="text-xs text-muted-foreground">OpenAI GPT-4o</span>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <Button variant="outline" onClick={onLogout} className="w-full gap-2">
                <LogOut className="w-4 h-4" />
                Sign out
              </Button>
            </div>

            <Separator />

            {/* Danger Zone */}
            <div className="space-y-2 p-3 -mx-3 rounded-xl bg-destructive/[0.03] border border-destructive/10">
              <p className="text-xs font-medium text-destructive/60 uppercase tracking-wide">Danger Zone</p>
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(true)}
                className="w-full gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Data
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <AlertTriangle className="w-4 h-4" />
                Delete Account
              </Button>
            </div>
          </div>
        )}

        {/* Clear All Data Confirmation */}
        {showClearConfirm && (
          <div className="space-y-4 py-4 animate-fade-in">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-800">Clear All Data?</p>
                  <p className="text-sm text-amber-700 mt-1">
                    This will permanently delete all your:
                  </p>
                  <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Notes and transcripts</li>
                    <li>AI summaries and key points</li>
                    <li>Tags and folder assignments</li>
                    <li>Brain dump artifacts</li>
                    <li>Chat history</li>
                  </ul>
                  <p className="text-sm text-amber-700 mt-2 font-medium">
                    Your account will remain active.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1"
                disabled={isClearing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearData}
                disabled={isClearing}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                {isClearing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Clear All Data
              </Button>
            </div>
          </div>
        )}

        {/* Delete Account Confirmation */}
        {showDeleteConfirm && (
          <div className="space-y-4 py-4 animate-fade-in">
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-destructive">Delete Account Permanently?</p>
                  <p className="text-sm text-destructive/80 mt-1">
                    This action is <strong>irreversible</strong>. It will permanently delete:
                  </p>
                  <ul className="text-sm text-destructive/80 mt-2 space-y-1 list-disc list-inside">
                    <li>All your data (notes, transcripts, AI content)</li>
                    <li>Your user profile and preferences</li>
                    <li>Your authentication account</li>
                  </ul>
                  <p className="text-sm text-destructive/80 mt-2">
                    You will not be able to recover any data or reuse this email address.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Type <span className="font-mono bg-muted px-1 rounded">DELETE</span> to confirm:
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                className="font-mono"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                className="flex-1"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                className="flex-1"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Delete Forever
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
