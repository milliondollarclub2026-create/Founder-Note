'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Brain, Loader2, AlertTriangle, RefreshCw, Zap, Lightbulb,
  HelpCircle, CheckCircle2, Layers, FileText, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Section component for brain dump categories
const BrainDumpSection = ({ title, icon: Icon, items, color, onNoteClick }) => {
  if (!items || items.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-1.5 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-medium text-foreground/80">{title}</h3>
        <span className="text-[10px] text-muted-foreground/60 bg-secondary/50 px-1.5 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div className="space-y-2 pl-1">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => item.noteId && onNoteClick(item.noteId)}
            className={`w-full text-left group flex items-start gap-3 p-3 rounded-xl transition-all ${
              item.noteId
                ? 'hover:bg-secondary/50 cursor-pointer'
                : 'cursor-default'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-2 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground/80 leading-relaxed">
                {item.text}
              </p>
              {item.noteTitle && (
                <p className="text-[10px] text-muted-foreground/50 mt-1 flex items-center gap-1">
                  <FileText className="w-2.5 h-2.5" />
                  {item.noteTitle}
                  {item.noteId && (
                    <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </p>
              )}
              {item.noteCount && (
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  Across {item.noteCount} notes
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// Brain Dump View - Synthesized thoughts from notes with caching
export const BrainDumpView = ({ contextScope, onNoteClick, noteCount }) => {
  const [synthesis, setSynthesis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isCached, setIsCached] = useState(false)
  const [cachedAt, setCachedAt] = useState(null)
  const prevScopeRef = useRef(null)

  const fetchBrainDump = useCallback(async (forceRefresh = false) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/brain-dump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextScope, forceRefresh })
      })

      if (!response.ok) throw new Error('Failed to fetch')

      const data = await response.json()
      setSynthesis(data.synthesis)
      setIsCached(data.cached || false)
      setCachedAt(data.cachedAt || null)
    } catch (err) {
      setError('Unable to synthesize thoughts')
      console.error('Brain dump error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [contextScope])

  // Fetch brain dump when context changes
  useEffect(() => {
    const currentScopeKey = JSON.stringify(contextScope)

    // Only refetch if scope actually changed
    if (prevScopeRef.current === currentScopeKey) return
    prevScopeRef.current = currentScopeKey

    fetchBrainDump()
  }, [contextScope, fetchBrainDump])

  // Get scope description for display
  const getScopeLabel = () => {
    if (contextScope?.type === 'folder') return contextScope.folder
    if (contextScope?.type === 'tag') return `#${contextScope.tag}`
    return 'All Notes'
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="relative">
          <Brain className="w-12 h-12 text-primary/20" />
          <Loader2 className="w-6 h-6 text-primary animate-spin absolute -bottom-1 -right-1" />
        </div>
        <p className="text-sm text-muted-foreground mt-4">Synthesizing your thoughts...</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Analyzing {noteCount} notes</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="ghost" size="sm" onClick={fetchBrainDump} className="mt-3">
          <RefreshCw className="w-3 h-3 mr-1.5" /> Try again
        </Button>
      </div>
    )
  }

  if (!synthesis) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Brain className="w-12 h-12 text-primary/20 mb-3" />
        <p className="text-sm text-muted-foreground">Loading brain dump...</p>
      </div>
    )
  }

  const hasContent =
    synthesis.openThoughts?.length > 0 ||
    synthesis.decisions?.length > 0 ||
    synthesis.questions?.length > 0 ||
    synthesis.blockers?.length > 0 ||
    synthesis.ideas?.length > 0 ||
    synthesis.themes?.length > 0

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Brain className="w-12 h-12 text-muted-foreground/20 mb-3" />
        <p className="text-sm text-muted-foreground">Your mind is clear</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {noteCount === 0
            ? 'Record some notes to see your thoughts here'
            : 'No significant thoughts extracted from current notes'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-3">
          <Brain className="w-4 h-4 text-primary/70" />
          <span className="text-sm font-medium text-primary/80">Brain Dump</span>
          <span className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-full">
            {getScopeLabel()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground/60">
          {"What's on your mind based on"} {noteCount} note{noteCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Themes - shown first as they span multiple notes */}
      {synthesis.themes?.length > 0 && (
        <div className="mb-8 p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-primary/70" />
            <span className="text-sm font-medium text-primary/80">Recurring Themes</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {synthesis.themes.map((theme, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/50 text-sm text-foreground/70"
              >
                {theme.text}
                {theme.noteCount && (
                  <span className="text-[10px] text-muted-foreground/50">
                    ({theme.noteCount})
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Open Thoughts */}
      <BrainDumpSection
        title="Open Thoughts"
        icon={Zap}
        items={synthesis.openThoughts}
        color="bg-amber-50 text-amber-700"
        onNoteClick={onNoteClick}
      />

      {/* Ideas */}
      <BrainDumpSection
        title="Ideas"
        icon={Lightbulb}
        items={synthesis.ideas}
        color="bg-emerald-50 text-emerald-700"
        onNoteClick={onNoteClick}
      />

      {/* Questions */}
      <BrainDumpSection
        title="Unresolved Questions"
        icon={HelpCircle}
        items={synthesis.questions}
        color="bg-violet-50 text-violet-700"
        onNoteClick={onNoteClick}
      />

      {/* Decisions */}
      <BrainDumpSection
        title="Decisions"
        icon={CheckCircle2}
        items={synthesis.decisions}
        color="bg-primary/10 text-primary"
        onNoteClick={onNoteClick}
      />

      {/* Blockers */}
      <BrainDumpSection
        title="Blockers & Concerns"
        icon={AlertTriangle}
        items={synthesis.blockers}
        color="bg-red-50 text-red-700"
        onNoteClick={onNoteClick}
      />

      {/* Footer with cache status and refresh */}
      <div className="flex flex-col items-center gap-2 mt-8 pb-4">
        {isCached && (
          <p className="text-[10px] text-muted-foreground/40">
            Loaded from cache • Updated{' '}
            {cachedAt
              ? new Date(cachedAt).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                })
              : 'recently'
            }
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchBrainDump(true)}
          disabled={isLoading}
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-1.5" />
          )}
          {isCached ? 'Re-synthesize' : 'Refresh'}
        </Button>
      </div>
    </div>
  )
}
