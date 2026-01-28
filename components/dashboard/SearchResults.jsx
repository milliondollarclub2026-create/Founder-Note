'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, FileText } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

// Highlight matching text in a string
const HighlightText = ({ text, query }) => {
  if (!query?.trim() || !text) return <>{text}</>
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5 font-medium">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

// Extract a snippet around the first match in the text
const getMatchSnippet = (text, query, maxLen = 100) => {
  if (!text || !query?.trim()) return text?.substring(0, maxLen) || ''
  const lower = text.toLowerCase()
  const idx = lower.indexOf(query.toLowerCase())
  if (idx === -1) return text.substring(0, maxLen)
  const start = Math.max(0, idx - 30)
  const end = Math.min(text.length, idx + query.length + 70)
  let snippet = text.substring(start, end)
  if (start > 0) snippet = '\u2026' + snippet
  if (end < text.length) snippet = snippet + '\u2026'
  return snippet
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
          // Determine which field matched and get the best snippet
          const q = query?.toLowerCase() || ''
          let matchField = 'note'
          let snippetText = note.summary || note.transcription?.substring(0, 100) || ''

          if (note.title?.toLowerCase().includes(q)) {
            matchField = 'title'
            // Title already highlighted, show summary snippet with match if available
            snippetText = getMatchSnippet(note.summary || note.transcription || '', query)
          } else if (note.summary?.toLowerCase().includes(q)) {
            matchField = 'summary'
            snippetText = getMatchSnippet(note.summary, query)
          } else if (note.transcription?.toLowerCase().includes(q)) {
            matchField = 'transcript'
            snippetText = getMatchSnippet(note.transcription, query)
          } else if (note.tags?.some(t => t.toLowerCase().includes(q))) {
            matchField = 'tag'
          }

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
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  <HighlightText text={snippetText} query={query} />
                </p>
              </div>
            </button>
          )
        })}
      </ScrollArea>
    </div>
  )
}
