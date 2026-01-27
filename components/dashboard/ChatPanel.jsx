'use client'

import { useState, useEffect, useRef } from 'react'
import {
  FileText, Folder, Tag, Home, ChevronUp, X, Send,
  Loader2, Sparkles, MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

// Context-Aware Chat Bar Component - handles all scopes
export const ContextAwareChatBar = ({ contextScope, isExpanded, onToggle, noteCount }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [scopeInfo, setScopeInfo] = useState(null)
  const endRef = useRef(null)
  const prevScopeRef = useRef(null)

  // Clear messages when context scope changes
  useEffect(() => {
    const currentScopeKey = JSON.stringify(contextScope)
    const prevScopeKey = prevScopeRef.current

    if (prevScopeKey && prevScopeKey !== currentScopeKey) {
      // Context changed - reset chat
      setMessages([])
      setScopeInfo(null)
    }
    prevScopeRef.current = currentScopeKey
  }, [contextScope])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Get scope-specific display info - using cohesive warm palette
  const getScopeDisplay = () => {
    switch (contextScope.type) {
      case 'note':
        return {
          icon: <FileText className="w-4 h-4" />,
          title: `Focused on: ${contextScope.noteTitle || 'This Note'}`,
          placeholder: 'Ask about this note...',
          hint: "I can only see this note's content",
          color: 'text-emerald-700',
          bgColor: 'bg-emerald-50/80',
          borderColor: 'border-emerald-200/60',
          glowColor: 'shadow-emerald-100/50'
        }
      case 'folder':
        return {
          icon: <Folder className="w-4 h-4" />,
          title: `Folder: ${contextScope.folder}`,
          placeholder: `Ask about notes in ${contextScope.folder}...`,
          hint: `Scoped to ${noteCount || 0} note${noteCount !== 1 ? 's' : ''} in this folder`,
          color: 'text-amber-700',
          bgColor: 'bg-amber-50/80',
          borderColor: 'border-amber-200/60',
          glowColor: 'shadow-amber-100/50'
        }
      case 'tag':
        return {
          icon: <Tag className="w-4 h-4" />,
          title: `Tag: #${contextScope.tag}`,
          placeholder: `Ask about notes tagged ${contextScope.tag}...`,
          hint: `Scoped to ${noteCount || 0} note${noteCount !== 1 ? 's' : ''} with this tag`,
          color: 'text-violet-700',
          bgColor: 'bg-violet-50/80',
          borderColor: 'border-violet-200/60',
          glowColor: 'shadow-violet-100/50'
        }
      default:
        return {
          icon: <Home className="w-4 h-4" />,
          title: 'All Notes',
          placeholder: 'Search across all your notes...',
          hint: `Access to all ${noteCount || 0} notes`,
          color: 'text-primary',
          bgColor: 'bg-primary/5',
          borderColor: 'border-primary/15',
          glowColor: 'shadow-primary/10'
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
        className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-card border shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 ${scopeDisplay.borderColor} ${scopeDisplay.glowColor}`}
        style={{ minWidth: 'min(560px, 90vw)' }}
      >
        {/* Remy avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 flex-shrink-0">
          <span className="text-sm font-semibold text-primary">R</span>
        </div>
        <div className="flex-1">
          <span className="text-sm text-muted-foreground">Ask Remy anything...</span>
        </div>
        <div className={`text-[10px] px-2 py-0.5 rounded-full ${scopeDisplay.bgColor} ${scopeDisplay.color} font-medium`}>
          {contextScope.type === 'note' ? 'Note' : contextScope.type === 'folder' ? contextScope.folder : contextScope.type === 'tag' ? `#${contextScope.tag}` : 'Global'}
        </div>
        <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    )
  }

  return (
    <div className={`bg-card border rounded-2xl shadow-xl animate-slide-up overflow-hidden w-full max-w-[600px] ${scopeDisplay.borderColor}`}>
      {/* Header with Remy identity and scope indicator */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${scopeDisplay.bgColor}`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
            <span className="text-xs font-semibold text-primary">R</span>
          </div>
          <div>
            <span className="text-sm font-medium">Remy</span>
            <p className={`text-[10px] ${scopeDisplay.color} opacity-80`}>{scopeDisplay.hint}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-[10px] px-2 py-0.5 rounded-full ${scopeDisplay.bgColor} ${scopeDisplay.color} font-medium border ${scopeDisplay.borderColor}`}>
            {scopeDisplay.title}
          </div>
          <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-secondary transition-smooth">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggestion Pills - educate users about flows */}
      {messages.length === 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setInput("Hey Remy, remember this: ")}
            className="text-[10px] px-2.5 py-1 rounded-full bg-primary/5 text-primary/70 border border-primary/10 hover:bg-primary/10 transition-colors"
          >
            Try: &quot;Hey Remy, remember this&quot;
          </button>
          <button
            onClick={() => setInput("Remy, don't forget ")}
            className="text-[10px] px-2.5 py-1 rounded-full bg-primary/5 text-primary/70 border border-primary/10 hover:bg-primary/10 transition-colors"
          >
            &quot;Remy, don&apos;t forget...&quot;
          </button>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="h-64 px-4 py-3">
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-6">
              <div className={`w-10 h-10 rounded-full ${scopeDisplay.bgColor} flex items-center justify-center mx-auto mb-3`}>
                <Sparkles className={`w-5 h-5 ${scopeDisplay.color}`} />
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
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                {msg.role === 'assistant' && (
                  <div className="px-3 pt-2 pb-0.5">
                    <span className="text-[10px] font-medium text-primary/60">Remy</span>
                  </div>
                )}
                <div className={`px-3 ${msg.role === 'assistant' ? 'pb-2' : 'py-2'} rounded-xl text-sm`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.sources?.length > 0 && (
                    <div className="text-[10px] opacity-60 mt-1.5 pt-1.5 border-t border-current/10">
                      <span className="font-medium">Sources:</span> {msg.sources.map(s => s.title).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex">
              <div className="bg-secondary px-3 py-2 rounded-xl flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs text-muted-foreground">Remy is thinking...</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={scopeDisplay.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/30"
            autoFocus
          />
          <Button size="sm" onClick={sendMessage} disabled={!input.trim() || isLoading} className="h-9 px-4">
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Legacy wrapper for backward compatibility
export const GlobalChatBar = ({ isExpanded, onToggle, contextScope, noteCount }) => {
  return (
    <ContextAwareChatBar
      contextScope={contextScope || { type: 'global' }}
      isExpanded={isExpanded}
      onToggle={onToggle}
      noteCount={noteCount}
    />
  )
}
