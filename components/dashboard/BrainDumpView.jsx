'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  RefreshCw, Zap, Lightbulb, HelpCircle, CheckCircle2,
  AlertTriangle, FileText, ArrowRight, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Relative time formatter
const getRelativeTime = (dateStr) => {
  if (!dateStr) return ''
  const now = new Date()
  const then = new Date(dateStr)
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay === 1) return 'yesterday'
  if (diffDay < 7) return `${diffDay}d ago`
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Section config — order, labels, icons
const SECTIONS = [
  { key: 'openThoughts', label: 'Open Thoughts', Icon: Zap },
  { key: 'ideas', label: 'Ideas', Icon: Lightbulb },
  { key: 'questions', label: 'Unresolved Questions', Icon: HelpCircle },
  { key: 'decisions', label: 'Decisions', Icon: CheckCircle2 },
  { key: 'blockers', label: 'Blockers & Concerns', Icon: AlertTriangle },
]

// Single fragment item — editorial quote style
const FragmentItem = ({ item, onNoteClick, isFirst }) => (
  <button
    onClick={() => item.noteId && onNoteClick(item.noteId)}
    className={`w-full text-left group block rounded-lg transition-all duration-300 ${
      item.noteId ? 'hover:bg-primary/[0.02] cursor-pointer' : 'cursor-default'
    }`}
  >
    <div className="flex gap-3 py-2 px-1">
      {/* Decorative left accent */}
      <div className={`w-[3px] rounded-full flex-shrink-0 mt-1 transition-colors duration-300 ${
        item.noteId ? 'bg-primary/15 group-hover:bg-primary/30' : 'bg-primary/10'
      }`} style={{ minHeight: '1.5rem' }} />

      <div className="flex-1 min-w-0">
        <p className="text-[15px] leading-[1.75] font-medium text-foreground tracking-[-0.01em]">
          {item.text}
        </p>
        {item.noteTitle && (
          <p className="text-[10.5px] text-muted-foreground/50 mt-1 flex items-center gap-1">
            <span className="text-muted-foreground/40">&mdash;</span>
            <FileText className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">{item.noteTitle}</span>
            {item.noteId && (
              <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0" />
            )}
          </p>
        )}
      </div>
    </div>
  </button>
)

// Content section (Open Thoughts, Ideas, etc.)
const ContentSection = ({ label, Icon, items, onNoteClick, animIndex }) => {
  if (!items || items.length === 0) return null

  return (
    <div
      className="opacity-0 animate-fade-in"
      style={{ animationDelay: `${animIndex * 80}ms`, animationFillMode: 'forwards' }}
    >
      <div className="border-t border-border/40 pt-8 mb-6">
        <div className="flex items-center gap-2.5 mb-5">
          <Icon className="w-4 h-4 text-primary/50" />
          <p className="text-sm font-semibold text-foreground/80 tracking-[-0.01em]">
            {label}
          </p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground tabular-nums">
            {items.length}
          </span>
        </div>
        <div className="space-y-1">
          {items.map((item, i) => (
            <FragmentItem key={i} item={item} onNoteClick={onNoteClick} isFirst={i === 0} />
          ))}
        </div>
      </div>
    </div>
  )
}

// Shimmer loading skeleton
const LoadingSkeleton = () => (
  <div className="pt-2">
    <p className="text-sm text-muted-foreground/50 animate-breathe mb-10">
      Reflecting on your thoughts...
    </p>

    {/* Simulated theme pills */}
    <div className="flex gap-2 mb-12">
      <div className="h-8 w-24 rounded-full bg-secondary/50 animate-shimmer" />
      <div className="h-8 w-32 rounded-full bg-secondary/40 animate-shimmer" style={{ animationDelay: '0.2s' }} />
      <div className="h-8 w-20 rounded-full bg-secondary/35 animate-shimmer" style={{ animationDelay: '0.4s' }} />
    </div>

    {/* Simulated sections */}
    {[0, 1, 2].map(section => (
      <div key={section} className="mb-10" style={{ animationDelay: `${section * 0.15}s` }}>
        <div className="h-2.5 w-28 rounded-full bg-secondary/40 animate-shimmer mb-6" />
        <div className="space-y-4 pl-4">
          <div className="flex gap-3">
            <div className="w-0.5 rounded-full bg-secondary/25" style={{ minHeight: '2.5rem' }} />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-5/6 rounded-full bg-secondary/50 animate-shimmer" style={{ animationDelay: `${section * 0.15 + 0.1}s` }} />
              <div className="h-2 w-24 rounded-full bg-secondary/25 animate-shimmer" style={{ animationDelay: `${section * 0.15 + 0.2}s` }} />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-0.5 rounded-full bg-secondary/20" style={{ minHeight: '2.5rem' }} />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-2/3 rounded-full bg-secondary/45 animate-shimmer" style={{ animationDelay: `${section * 0.15 + 0.3}s` }} />
              <div className="h-2 w-20 rounded-full bg-secondary/25 animate-shimmer" style={{ animationDelay: `${section * 0.15 + 0.4}s` }} />
            </div>
          </div>
          {section === 0 && (
            <div className="flex gap-3">
              <div className="w-0.5 rounded-full bg-secondary/20" style={{ minHeight: '2.5rem' }} />
              <div className="space-y-2 flex-1">
                <div className="h-3.5 w-3/4 rounded-full bg-secondary/40 animate-shimmer" style={{ animationDelay: '0.6s' }} />
                <div className="h-2 w-28 rounded-full bg-secondary/20 animate-shimmer" style={{ animationDelay: '0.7s' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
)

// Brain Dump View — Reflective lens over notes
export const BrainDumpView = ({
  contextScope,
  onNoteClick,
  noteCount,
  cachedSynthesis,
  onSynthesisLoaded,
  isStale
}) => {
  const [synthesis, setSynthesis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [isCached, setIsCached] = useState(false)
  const [cachedAt, setCachedAt] = useState(null)
  const prevScopeRef = useRef(null)
  const abortRef = useRef(null)

  const scopeKey = JSON.stringify(contextScope)

  const fetchBrainDump = useCallback(async (forceRefresh = false) => {
    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (forceRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const response = await fetch('/api/brain-dump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextScope, forceRefresh }),
        signal: controller.signal
      })

      if (!response.ok) throw new Error('Failed to fetch')

      const data = await response.json()
      setSynthesis(data.synthesis)
      setIsCached(data.cached || false)
      setCachedAt(data.cachedAt || new Date().toISOString())

      // Notify parent to cache
      onSynthesisLoaded?.({
        scopeKey,
        synthesis: data.synthesis,
        cachedAt: data.cachedAt || new Date().toISOString()
      })
    } catch (err) {
      if (err.name === 'AbortError') return
      setError('Unable to synthesize thoughts')
      console.error('Brain dump error:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [contextScope, scopeKey, onSynthesisLoaded])

  // Handle scope changes and cache-aware fetching
  useEffect(() => {
    const scopeChanged = prevScopeRef.current !== scopeKey
    prevScopeRef.current = scopeKey

    if (scopeChanged) {
      // Scope changed — check if parent has cached data for new scope
      if (cachedSynthesis && !isStale) {
        setSynthesis(cachedSynthesis.synthesis)
        setIsCached(true)
        setCachedAt(cachedSynthesis.cachedAt)
        setIsLoading(false)
        return
      }
      // No cache for this scope — fetch
      fetchBrainDump()
      return
    }

    // Same scope — only refetch if stale and we have no data, or if stale and we DO have data (background refresh)
    if (isStale && !synthesis) {
      fetchBrainDump()
    } else if (isStale && synthesis) {
      // We have stale data — show existing while fetching fresh
      fetchBrainDump()
    } else if (!synthesis && cachedSynthesis) {
      // First mount with cached data available
      setSynthesis(cachedSynthesis.synthesis)
      setIsCached(true)
      setCachedAt(cachedSynthesis.cachedAt)
    } else if (!synthesis && !cachedSynthesis) {
      // First mount, no cache at all
      fetchBrainDump()
    }
  }, [scopeKey, isStale, cachedSynthesis, fetchBrainDump])

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  // Scope label for subtitle
  const getScopeLabel = () => {
    if (contextScope?.type === 'folder') return contextScope.folder
    if (contextScope?.type === 'tag') return `#${contextScope.tag}`
    return null
  }

  const scopeLabel = getScopeLabel()

  // Loading state — show skeleton (but not if we're just refreshing with existing data)
  if (isLoading && !synthesis) {
    return (
      <div className="animate-fade-in max-w-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-[-0.02em]">
              What&apos;s on your mind
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              Analyzing {noteCount} note{noteCount !== 1 ? 's' : ''}
              {scopeLabel ? ` in ${scopeLabel}` : ''}
            </p>
          </div>
        </div>
        <div className="w-16 h-[2px] bg-primary/20 rounded-full mb-8" />
        <LoadingSkeleton />
      </div>
    )
  }

  // Error state
  if (error && !synthesis) {
    return (
      <div className="flex flex-col items-center justify-center h-96 animate-fade-in">
        <p className="text-sm text-foreground/60 mb-4">Couldn&apos;t reflect on your notes</p>
        <Button variant="ghost" size="sm" onClick={() => fetchBrainDump()} className="text-muted-foreground">
          <RefreshCw className="w-3 h-3 mr-1.5" /> Try again
        </Button>
      </div>
    )
  }

  // No synthesis yet (shouldn't normally reach here)
  if (!synthesis) {
    return (
      <div className="flex flex-col items-center justify-center h-96 animate-fade-in">
        <div className="w-12 h-px bg-border/40 mb-4" />
        <p className="text-sm text-muted-foreground/50">Loading...</p>
      </div>
    )
  }

  // Check if any content exists
  const hasContent =
    synthesis.openThoughts?.length > 0 ||
    synthesis.decisions?.length > 0 ||
    synthesis.questions?.length > 0 ||
    synthesis.blockers?.length > 0 ||
    synthesis.ideas?.length > 0 ||
    synthesis.themes?.length > 0

  // Empty state
  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-96 animate-fade-in">
        <div className="w-12 h-px bg-border/40 mb-4" />
        <p className="text-base font-light italic text-foreground/50">
          Your mind is clear.
        </p>
        <p className="text-xs text-muted-foreground/50 mt-2">
          {noteCount === 0
            ? 'Record a note and come back to see what\'s on your mind'
            : scopeLabel
            ? `No significant thoughts extracted from notes in ${scopeLabel}`
            : 'No significant thoughts extracted from current notes'
          }
        </p>
      </div>
    )
  }

  // Count non-empty sections for animation indexing
  let animIndex = 0
  const themesExist = synthesis.themes?.length > 0

  // Total fragment count for header subtitle
  const totalFragments = [
    synthesis.openThoughts, synthesis.ideas, synthesis.questions,
    synthesis.decisions, synthesis.blockers
  ].reduce((sum, arr) => sum + (arr?.length || 0), 0)

  return (
    <div className="animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-[-0.02em]">
            What&apos;s on your mind
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            {totalFragments} thought{totalFragments !== 1 ? 's' : ''} from {noteCount} note{noteCount !== 1 ? 's' : ''}
            {scopeLabel ? ` in ${scopeLabel}` : ''}
          </p>
        </div>
        <button
          onClick={() => fetchBrainDump(true)}
          disabled={isRefreshing}
          className="p-2 rounded-lg text-muted-foreground/40 hover:text-muted-foreground/70 hover:bg-secondary/40 transition-all duration-200 mt-0.5"
          title="Re-synthesize"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Decorative rule under header */}
      <div className="w-16 h-[2px] bg-primary/20 rounded-full mb-8" />

      {/* Refreshing indicator — subtle bar */}
      {isRefreshing && (
        <div className="flex items-center gap-2 mb-6 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
          <Loader2 className="w-3 h-3 text-primary/50 animate-spin" />
          <span className="text-[11px] text-muted-foreground/50">Updating...</span>
        </div>
      )}

      {/* Recurring Threads (Themes) */}
      {themesExist && (
        <div
          className="mb-10 opacity-0 animate-fade-in"
          style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
        >
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
            Recurring Threads
          </p>
          <div className="flex flex-wrap gap-2">
            {synthesis.themes.map((theme, i) => (
              <span
                key={i}
                className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-primary/[0.04] border border-primary/[0.08] text-[13.5px] text-foreground/80 transition-colors duration-200 hover:bg-primary/[0.08] hover:border-primary/[0.15]"
              >
                {theme.text}
                {theme.noteCount && (
                  <span className="text-[10px] text-muted-foreground/50 ml-2 tabular-nums">
                    {theme.noteCount}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Content Sections */}
      {SECTIONS.map(({ key, label, Icon }) => {
        const items = synthesis[key]
        if (!items || items.length === 0) return null
        const currentIndex = themesExist ? ++animIndex : animIndex++
        return (
          <ContentSection
            key={key}
            label={label}
            Icon={Icon}
            items={items}
            onNoteClick={onNoteClick}
            animIndex={currentIndex}
          />
        )
      })}

      {/* Footer — cache timestamp */}
      {isCached && cachedAt && (
        <div className="flex justify-end items-center gap-2 mt-12 pb-4">
          <div className="flex-1 h-px bg-border/30" />
          <span className="text-[10px] text-muted-foreground/40 whitespace-nowrap">
            Synthesized {getRelativeTime(cachedAt)}
          </span>
        </div>
      )}
    </div>
  )
}
