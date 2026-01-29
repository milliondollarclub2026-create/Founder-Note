'use client'

import { useState, useEffect, useRef } from 'react'
import {
  FileText, Folder, Tag, Home, ChevronUp, ChevronDown, X, ArrowUp,
  Loader2, Sparkles, MessageCircle, RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

// Simple markdown renderer for chat messages — handles **bold** and numbered lists
const renderChatText = (text) => {
  if (!text) return null
  // Split by **bold** markers and render
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

// Context-Aware Chat Bar Component - handles all scopes
export const ContextAwareChatBar = ({ contextScope, isExpanded, onToggle, noteCount, onSelectNote, onIntentCaptured }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [scopeInfo, setScopeInfo] = useState(null)
  const [isPillsExpanded, setIsPillsExpanded] = useState(true) // Pills sleeve state
  const endRef = useRef(null)
  const prevScopeRef = useRef(null)
  const messageCacheRef = useRef({}) // Cache messages per scope key

  // Save/restore messages when context scope changes
  useEffect(() => {
    const currentScopeKey = JSON.stringify(contextScope)
    const prevScopeKey = prevScopeRef.current

    if (prevScopeKey && prevScopeKey !== currentScopeKey) {
      // Save current messages to cache before switching
      messageCacheRef.current[prevScopeKey] = messages

      // Restore cached messages for new scope, or start fresh
      const cached = messageCacheRef.current[currentScopeKey]
      setMessages(cached || [])
      setScopeInfo(null)
    }
    prevScopeRef.current = currentScopeKey
  }, [contextScope])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Clear chat function - clears messages and removes from cache
  const clearChat = () => {
    const currentScopeKey = JSON.stringify(contextScope)
    setMessages([])
    delete messageCacheRef.current[currentScopeKey]
    setScopeInfo(null)
    setIsPillsExpanded(true)  // Reset pills to expanded state
  }

  // Scope colors — tonal variations within the cashmere/burgundy family
  const scopeStyles = {
    note: {
      color: 'hsl(350 30% 50%)',     // soft rose — lighter burgundy
      bg: 'hsl(350 30% 50% / 0.06)',
      border: 'hsl(350 30% 50% / 0.15)',
    },
    folder: {
      color: 'hsl(15 32% 44%)',      // warm sienna — earthy brown-red
      bg: 'hsl(15 32% 44% / 0.06)',
      border: 'hsl(15 32% 44% / 0.15)',
    },
    tag: {
      color: 'hsl(340 24% 48%)',     // dusty berry — muted rose
      bg: 'hsl(340 24% 48% / 0.06)',
      border: 'hsl(340 24% 48% / 0.15)',
    },
    global: {
      color: 'hsl(355 48% 39%)',     // garnet (primary)
      bg: 'hsl(355 48% 39% / 0.05)',
      border: 'hsl(355 48% 39% / 0.15)',
    },
  }

  const getScopeDisplay = () => {
    const st = scopeStyles[contextScope.type] || scopeStyles.global
    switch (contextScope.type) {
      case 'note':
        return {
          ...st,
          icon: <FileText className="w-4 h-4" />,
          title: `Focused on: ${contextScope.noteTitle || 'This Note'}`,
          placeholder: 'Ask about this note...',
          hint: "I can only see this note's content",
        }
      case 'folder':
        return {
          ...st,
          icon: <Folder className="w-4 h-4" />,
          title: `Folder: ${contextScope.folder}`,
          placeholder: `Ask about notes in ${contextScope.folder}...`,
          hint: `Scoped to ${noteCount || 0} note${noteCount !== 1 ? 's' : ''} in this folder`,
        }
      case 'tag':
        return {
          ...st,
          icon: <Tag className="w-4 h-4" />,
          title: `Tag: #${contextScope.tag}`,
          placeholder: `Ask about notes tagged ${contextScope.tag}...`,
          hint: `Scoped to ${noteCount || 0} note${noteCount !== 1 ? 's' : ''} with this tag`,
        }
      default:
        return {
          ...st,
          icon: <Home className="w-4 h-4" />,
          title: 'All Notes',
          placeholder: 'Search across all your notes...',
          hint: `Access to all ${noteCount || 0} notes`,
        }
    }
  }

  const scopeDisplay = getScopeDisplay()

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setIsPillsExpanded(false) // Collapse pills when sending
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          contextScope
        })
      })
      const data = await response.json()
      if (data.scope) {
        setScopeInfo(data.scope)
      }
      if (data.intentCaptured) {
        // Small delay to ensure DB write has committed before re-fetching
        setTimeout(() => onIntentCaptured?.(), 300)
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        sources: data.sources,
        scope: data.scope
      }])
    } catch (error) {
      toast.error('Failed to send')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isExpanded) {
    return (
      <div
        onClick={onToggle}
        className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-card border shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200"
        style={{ width: 'min(620px, 90vw)', borderColor: scopeDisplay.border }}
      >
        {/* Remy avatar */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: scopeDisplay.bg, border: `1px solid ${scopeDisplay.border}` }}>
          <span className="text-sm font-semibold" style={{ color: scopeDisplay.color }}>R</span>
        </div>
        <div className="flex-1">
          <span className="text-sm text-muted-foreground">Ask Remy anything...</span>
        </div>
        <div className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: scopeDisplay.bg, color: scopeDisplay.color }}>
          {contextScope.type === 'note' ? 'Note' : contextScope.type === 'folder' ? contextScope.folder : contextScope.type === 'tag' ? `#${contextScope.tag}` : 'Global'}
        </div>
        <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-2xl shadow-xl animate-slide-up overflow-hidden w-full max-w-[680px]" style={{ width: 'min(620px, 90vw)', borderColor: scopeDisplay.border }}>
      {/* Header with Remy identity and scope indicator */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: scopeDisplay.bg }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: scopeDisplay.bg, border: `1px solid ${scopeDisplay.border}` }}>
            <span className="text-xs font-semibold" style={{ color: scopeDisplay.color }}>R</span>
          </div>
          <div>
            <span className="text-sm font-medium">Remy</span>
            <p className="text-[10px] opacity-80" style={{ color: scopeDisplay.color }}>{scopeDisplay.hint}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: scopeDisplay.bg, color: scopeDisplay.color, border: `1px solid ${scopeDisplay.border}` }}>
            {scopeDisplay.title}
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg hover:bg-secondary transition-smooth"
              title="Clear conversation"
            >
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-secondary transition-smooth">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="h-64 px-4 py-3">
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: scopeDisplay.bg }}>
                <Sparkles className="w-5 h-5" style={{ color: scopeDisplay.color }} />
              </div>
              <p className="text-sm text-muted-foreground">
                {contextScope.type === 'note'
                  ? 'Ask questions about this specific note'
                  : contextScope.type === 'folder'
                  ? `Ask about notes in the "${contextScope.folder}" folder`
                  : contextScope.type === 'tag'
                  ? `Ask about notes tagged with "${contextScope.tag}"`
                  : 'Ask anything across all your notes'
                }
              </p>
              <p className="text-xs text-muted-foreground/60 mt-2 max-w-[280px] mx-auto">
                Say <span className="text-primary/80 font-medium">&quot;Hey Remy&quot;</span> to save an important thought I should remember
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-secondary/80 border border-border/50 rounded-bl-md'}`}>
                {msg.role === 'assistant' && (
                  <div className="px-3.5 pt-2.5 pb-0.5">
                    <span className="text-[10px] font-semibold text-primary/60">Remy</span>
                  </div>
                )}
                <div className={`px-3.5 ${msg.role === 'assistant' ? 'pb-2.5' : 'py-2.5'} text-sm leading-relaxed`}>
                  <span className="whitespace-pre-wrap">{msg.role === 'assistant' ? renderChatText(msg.content) : msg.content}</span>
                  {msg.sources?.length > 0 && (
                    <span className="inline-flex items-center gap-1 ml-1.5 align-baseline translate-y-[-1px]">
                      {[...msg.sources]
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .map((s, si) => (
                        <button
                          key={si}
                          onClick={(e) => { e.stopPropagation(); onSelectNote?.(s) }}
                          title={s.title}
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                        >
                          {si + 1}
                        </button>
                      ))}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex">
              <div className="bg-secondary/80 border border-border/50 px-3.5 py-2.5 rounded-2xl rounded-bl-md flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary/60" />
                <span className="text-xs text-muted-foreground">Remy is thinking...</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      {/* ═══ The Velvet Tray ═══ Premium Suggestion Sleeve */}
      <div className="relative">
        {/* Garnet accent line - the elegant separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-[hsl(355_48%_39%/0.2)] to-transparent" />

        {/* Collapsed state - The Mysterious Bar */}
        {messages.length > 0 && !isPillsExpanded && (
          <button
            onClick={() => setIsPillsExpanded(true)}
            className="group relative w-full h-10 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[hsl(34_35%_96%)] to-[hsl(34_30%_94%)] hover:from-[hsl(34_38%_97%)] hover:to-[hsl(34_32%_95%)] transition-all duration-300"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(355_48%_39%/0.06)] to-transparent sleeve-shimmer" />
            </div>
            {/* Centered gemstone symbol */}
            <div className="flex items-center gap-2 text-[hsl(355_48%_39%/0.4)] group-hover:text-[hsl(355_48%_39%/0.7)] transition-colors duration-300">
              <span className="text-xs tracking-[0.3em] font-light">✦ ✦ ✦</span>
            </div>
            {/* Subtle lift indicator */}
            <ChevronUp className="absolute right-4 w-3.5 h-3.5 text-[hsl(355_48%_39%/0.25)] group-hover:text-[hsl(355_48%_39%/0.5)] group-hover:-translate-y-0.5 transition-all duration-300" />
          </button>
        )}

        {/* Expanded state - The Velvet Tray */}
        <div
          className={`overflow-hidden transition-all duration-350 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            isPillsExpanded ? 'sleeve-expand' : 'sleeve-collapse'
          }`}
          style={{
            maxHeight: isPillsExpanded ? '160px' : '0',
          }}
        >
          {/* Tray background with subtle warmth gradient */}
          <div className="relative bg-gradient-to-b from-[hsl(34_35%_96%)] to-[hsl(34_30%_94%)] px-4 py-4">
            {/* Collapse handle - top right, minimal */}
            {messages.length > 0 && (
              <button
                onClick={() => setIsPillsExpanded(false)}
                className="absolute top-2 right-2 p-1.5 rounded-full text-[hsl(355_48%_39%/0.3)] hover:text-[hsl(355_48%_39%/0.6)] hover:bg-[hsl(355_48%_39%/0.05)] transition-all duration-200"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Pills Grid - Auto-fit magic */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(contextScope.type === 'note' ? [
                { label: 'Summarize', prompt: 'Summarize this note for me', icon: '✦' },
                { label: 'Key Points', prompt: 'What are the key takeaways from this note?', icon: '◈' },
                { label: 'To-dos', prompt: 'List the action items from this note', icon: '◇' },
                { label: 'Remy, remember', prompt: 'Hey Remy, remember this: ', icon: '♦', accent: true },
              ] : contextScope.type === 'folder' ? [
                { label: 'Summarize', prompt: `Summarize the notes in ${contextScope.folder}`, icon: '✦' },
                { label: 'Themes', prompt: 'What are the common themes across these notes?', icon: '◈' },
                { label: 'Questions', prompt: 'What open questions are there across these notes?', icon: '◇' },
                { label: 'Remy, remember', prompt: 'Hey Remy, remember this: ', icon: '♦', accent: true },
              ] : contextScope.type === 'tag' ? [
                { label: 'Insights', prompt: `What have I said about ${contextScope.tag}?`, icon: '✦' },
                { label: 'Patterns', prompt: 'What patterns do you see in these notes?', icon: '◈' },
                { label: 'To-dos', prompt: 'List all action items from these notes', icon: '◇' },
                { label: 'Remy, remember', prompt: 'Hey Remy, remember this: ', icon: '♦', accent: true },
              ] : [
                { label: 'Highlights', prompt: 'What are the highlights from my recent notes?', icon: '✦' },
                { label: 'Open items', prompt: 'What action items are still open?', icon: '◈' },
                { label: 'Themes', prompt: 'What are the key themes across my notes?', icon: '◇' },
                { label: 'Remy, remember', prompt: 'Hey Remy, remember this: ', icon: '♦', accent: true },
              ]).map((pill, i) => (
                <button
                  key={i}
                  onClick={() => setInput(pill.prompt)}
                  className={`velvet-pill group relative px-3 py-2.5 rounded-xl text-[11px] font-medium tracking-wide
                    ${pill.accent
                      ? 'bg-gradient-to-br from-[hsl(355_48%_39%)] to-[hsl(355_50%_32%)] text-white/95 border border-[hsl(355_48%_35%)] shadow-[inset_0_1px_0_hsl(355_48%_50%/0.3),0_2px_8px_hsl(355_48%_30%/0.2)] hover:from-[hsl(355_48%_42%)] hover:to-[hsl(355_50%_35%)] hover:shadow-[inset_0_1px_0_hsl(355_48%_55%/0.3),0_4px_16px_hsl(355_48%_30%/0.25)]'
                      : 'bg-[hsl(34_40%_98%)] text-[hsl(355_30%_35%)] border border-[hsl(34_25%_85%)] shadow-[inset_0_1px_0_hsl(0_0%_100%/0.7),0_1px_2px_hsl(355_30%_20%/0.04)] hover:bg-white hover:border-[hsl(355_48%_39%/0.25)] hover:text-[hsl(355_48%_39%)] hover:shadow-[inset_0_1px_0_hsl(0_0%_100%/0.9),0_4px_12px_hsl(355_48%_39%/0.1),0_0_0_1px_hsl(355_48%_39%/0.05)]'
                    }
                    hover:-translate-y-0.5
                    active:translate-y-0 active:scale-[0.98]
                    transition-all duration-200 ease-out
                    overflow-hidden`}
                  style={{
                    animationDelay: isPillsExpanded ? `${i * 40}ms` : '0ms',
                  }}
                >
                  {/* Inner highlight on hover */}
                  <span className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${pill.accent ? 'bg-gradient-to-b from-white/5 to-transparent' : 'bg-gradient-to-b from-[hsl(355_48%_39%/0.02)] to-transparent'}`} />
                  <span className="relative flex items-center justify-center gap-1.5">
                    <span className={`text-[9px] ${pill.accent ? 'text-white/70' : 'text-[hsl(355_48%_39%/0.5)] group-hover:text-[hsl(355_48%_39%/0.7)]'} transition-colors`}>{pill.icon}</span>
                    <span>{pill.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            placeholder={scopeDisplay.placeholder}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              // Auto-resize: reset then fit content
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            rows={1}
            className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/30 resize-none overflow-hidden"
            style={{ minHeight: '36px', maxHeight: '80px' }}
            autoFocus
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 disabled:opacity-30 hover:bg-primary/90 transition-all duration-150"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Legacy wrapper for backward compatibility
export const GlobalChatBar = ({ isExpanded, onToggle, contextScope, noteCount, onSelectNote, onIntentCaptured }) => {
  return (
    <ContextAwareChatBar
      contextScope={contextScope || { type: 'global' }}
      isExpanded={isExpanded}
      onToggle={onToggle}
      noteCount={noteCount}
      onSelectNote={onSelectNote}
      onIntentCaptured={onIntentCaptured}
    />
  )
}
