'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, FileText } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

// Highlight matching text in a string
const HighlightText = ({ text, query }) => {
  if (!query?.trim() || !text) return <>{text}</>
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/15 text-foreground rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export const SearchResults = ({ results, query, onSelect, onClose }) => {
  const [activeIndex, setActiveIndex] = useState(-1)

  // Reset active index when results change
  useEffect(() => { setActiveIndex(-1) }, [results])

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!results || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      onSelect(results[activeIndex])
      onClose()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }, [results, activeIndex, onSelect, onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // No results state
  if (query?.trim() && (!results || results.length === 0)) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 animate-scale-in">
        <div className="px-4 py-6 text-center">
          <Search className="w-5 h-5 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No results for &quot;{query}&quot;</p>
        </div>
      </div>
    )
  }

  if (!results || results.length === 0) return null

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 animate-scale-in">
      <ScrollArea className="max-h-80">
        {results.map((note, index) => {
          // Determine which field matched
          const q = query?.toLowerCase() || ''
          const matchField = note.title?.toLowerCase().includes(q) ? 'title'
            : note.summary?.toLowerCase().includes(q) ? 'summary'
            : note.transcription?.toLowerCase().includes(q) ? 'transcript'
            : note.tags?.some(t => t.toLowerCase().includes(q)) ? 'tag'
            : 'note'

          return (
            <button
              key={note.id}
              onClick={() => { onSelect(note); onClose() }}
              className={`w-full text-left px-4 py-3 transition-all duration-100 border-b border-border/50 last:border-0 flex items-start gap-3 ${
                index === activeIndex ? 'bg-primary/5' : 'hover:bg-secondary/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    <HighlightText text={note.title} query={query} />
                  </p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground/70 flex-shrink-0">
                    {matchField}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  <HighlightText text={note.summary || note.transcription?.substring(0, 80)} query={query} />
                </p>
              </div>
            </button>
          )
        })}
      </ScrollArea>
    </div>
  )
}
