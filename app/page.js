'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Mic, MicOff, MessageCircle, Search, Trash2, Star, Tag, Plus, 
  FolderOpen, Settings, CheckSquare, Home, MoreHorizontal, 
  Sparkles, ArrowLeft, User, FileText, X, Send, Loader2, Folder,
  FolderPlus, LayoutGrid, List, Clock, ChevronUp, Square, Copy, Save,
  RefreshCw, Edit3, Brain, Lightbulb, HelpCircle, AlertTriangle, 
  CheckCircle2, Layers, ArrowRight, Zap, LogOut, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

// Create Supabase client for auth
const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Constants
const TAG_COLORS = ['sapphire', 'emerald', 'amber', 'rose', 'slate', 'violet']
const DEFAULT_TAGS = [
  { name: 'important', color: 'rose' },
  { name: 'idea', color: 'amber' },
  { name: 'follow-up', color: 'emerald' },
  { name: 'meeting', color: 'sapphire' },
]
const DEFAULT_FOLDERS = ['Ideas', 'Meetings', 'Projects']

const getDemoUserId = () => {
  if (typeof window === 'undefined') return uuidv4()
  let id = localStorage.getItem('foundernote_userId')
  if (!id) { id = uuidv4(); localStorage.setItem('foundernote_userId', id) }
  return 'user-' + id
}

const getStoredTags = () => {
  if (typeof window === 'undefined') return DEFAULT_TAGS
  const stored = localStorage.getItem('foundernote_tags')
  return stored ? JSON.parse(stored) : DEFAULT_TAGS
}

const saveStoredTags = (tags) => {
  if (typeof window !== 'undefined') localStorage.setItem('foundernote_tags', JSON.stringify(tags))
}

const getStoredFolders = () => {
  if (typeof window === 'undefined') return DEFAULT_FOLDERS
  const stored = localStorage.getItem('foundernote_folders')
  return stored ? JSON.parse(stored) : DEFAULT_FOLDERS
}

const saveStoredFolders = (folders) => {
  if (typeof window !== 'undefined') localStorage.setItem('foundernote_folders', JSON.stringify(folders))
}

// Waveform
const Waveform = () => (
  <div className="flex items-center gap-0.5 h-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="w-0.5 bg-primary rounded-full waveform-bar" style={{ height: '4px' }} />
    ))}
  </div>
)

// Tag Badge - Premium rectangular style with soft corners
const TagBadge = ({ tag, onRemove, size = 'sm', removable = false }) => {
  const getTagStyle = (color) => {
    const colors = {
      rose: { bg: 'hsl(350, 60%, 94%)', text: 'hsl(350, 60%, 40%)', border: 'hsl(350, 55%, 85%)', dot: 'hsl(350, 65%, 55%)' },
      amber: { bg: 'hsl(38, 75%, 92%)', text: 'hsl(32, 70%, 35%)', border: 'hsl(38, 70%, 82%)', dot: 'hsl(38, 80%, 50%)' },
      emerald: { bg: 'hsl(160, 45%, 92%)', text: 'hsl(160, 50%, 32%)', border: 'hsl(160, 45%, 82%)', dot: 'hsl(160, 50%, 45%)' },
      sapphire: { bg: 'hsl(355, 48%, 92%)', text: 'hsl(355, 48%, 35%)', border: 'hsl(355, 45%, 82%)', dot: 'hsl(355, 48%, 45%)' },
      garnet: { bg: 'hsl(355, 48%, 92%)', text: 'hsl(355, 48%, 35%)', border: 'hsl(355, 45%, 82%)', dot: 'hsl(355, 48%, 45%)' },
      violet: { bg: 'hsl(270, 50%, 94%)', text: 'hsl(270, 55%, 42%)', border: 'hsl(270, 45%, 85%)', dot: 'hsl(270, 55%, 55%)' },
      sage: { bg: 'hsl(140, 30%, 92%)', text: 'hsl(140, 35%, 32%)', border: 'hsl(140, 28%, 82%)', dot: 'hsl(140, 30%, 42%)' },
      terracotta: { bg: 'hsl(18, 50%, 92%)', text: 'hsl(18, 55%, 35%)', border: 'hsl(18, 48%, 82%)', dot: 'hsl(18, 55%, 50%)' },
      plum: { bg: 'hsl(320, 35%, 92%)', text: 'hsl(320, 40%, 38%)', border: 'hsl(320, 32%, 82%)', dot: 'hsl(320, 35%, 50%)' },
      slate: { bg: 'hsl(215, 20%, 93%)', text: 'hsl(215, 25%, 40%)', border: 'hsl(215, 20%, 85%)', dot: 'hsl(215, 25%, 55%)' },
    }
    return colors[color] || colors.slate
  }
  
  const style = getTagStyle(tag.color)
  const sizeClasses = size === 'sm' 
    ? 'text-[10px] px-2 py-0.5 gap-1.5' 
    : 'text-xs px-2.5 py-1 gap-1.5'
  
  return (
    <span 
      className={`inline-flex items-center rounded-md font-medium transition-all ${sizeClasses} ${removable ? 'group-hover/tag:pr-0.5' : ''}`}
      style={{ 
        backgroundColor: style.bg, 
        color: style.text, 
        border: `1px solid ${style.border}` 
      }}
    >
      <span 
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: style.dot }}
      />
      <span className={removable ? 'group-hover/tag:hidden' : ''}>{tag.name}</span>
      {removable && <X className="w-3 h-3 hidden group-hover/tag:block" />}
      {onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="ml-0.5 hover:opacity-70 transition-opacity">
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  )
}

// Nav Item
const NavItem = ({ icon: Icon, label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-smooth
      ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
  >
    <Icon className="w-4 h-4 flex-shrink-0" />
    <span className="flex-1 text-left truncate">{label}</span>
    {count > 0 && <span className={`text-[11px] ${active ? 'opacity-80' : 'text-muted-foreground'}`}>{count}</span>}
  </button>
)

// Search Results Dropdown
const SearchResults = ({ results, onSelect, onClose }) => {
  if (results.length === 0) return null
  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 animate-fade-in">
      <ScrollArea className="max-h-80">
        {results.map(note => (
          <button
            key={note.id}
            onClick={() => { onSelect(note); onClose(); }}
            className="w-full text-left px-4 py-3 hover:bg-secondary/50 transition-smooth border-b border-border/50 last:border-0"
          >
            <p className="text-sm font-medium text-foreground truncate">{note.title}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{note.summary || note.transcription?.substring(0, 60)}</p>
          </button>
        ))}
      </ScrollArea>
    </div>
  )
}

// Note Card (Grid View) - Simplified without tag removal
const NoteCard = ({ note, onClick, onDelete, onStar, onAddTag, onAddToFolder, allTags, folders }) => {
  const [showActions, setShowActions] = useState(false)
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  // Convert tag strings to objects with colors from allTags
  const noteTags = (note.tags || []).map(tagName => {
    const tagConfig = allTags.find(at => at.name === tagName)
    return { name: tagName, color: tagConfig?.color || 'coral' }
  })
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className="group relative p-4 rounded-xl border border-border bg-card cursor-pointer transition-smooth hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5"
    >
      {/* Hover Actions */}
      <div className={`absolute top-3 right-3 flex items-center gap-0.5 bg-card/95 backdrop-blur-sm rounded-lg px-1 py-0.5 shadow-sm border border-border/50 transition-all ${showActions ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}>
        <button onClick={(e) => { e.stopPropagation(); onStar(note.id, !note.starred); }} className="p-1.5 rounded-md hover:bg-secondary transition-smooth">
          <Star className={`w-3.5 h-3.5 ${note.starred ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-md hover:bg-secondary transition-smooth">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Add Tag</div>
            {allTags.filter(t => !note.tags?.includes(t.name)).map(tag => (
              <DropdownMenuItem key={tag.name} onClick={(e) => { e.stopPropagation(); onAddTag(note.id, tag); }} className="gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getTagColor(tag.color) }} />
                <span className="font-medium">{tag.name}</span>
              </DropdownMenuItem>
            ))}
            {allTags.length === 0 && (
              <div className="px-2 py-2 text-xs text-muted-foreground">No tags yet</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-md hover:bg-secondary transition-smooth">
              <Folder className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Move to Folder</div>
            {folders.map(f => (
              <DropdownMenuItem key={f} onClick={(e) => { e.stopPropagation(); onAddToFolder(note.id, f); }} className={note.folder === f ? 'bg-secondary' : ''}>
                <Folder className="w-3.5 h-3.5 mr-2 folder-icon" />
                {f}
                {note.folder === f && <Check className="w-3 h-3 ml-auto text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} className="p-1.5 rounded-md hover:bg-destructive/10 transition-smooth">
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
      
      {/* Star indicator when not hovering */}
      {note.starred && !showActions && <Star className="absolute top-3 right-3 w-3.5 h-3.5 fill-primary text-primary" />}
      
      {/* Title */}
      <h3 className="font-semibold text-sm text-foreground line-clamp-1 mb-2 pr-8">{note.title}</h3>
      
      {/* Summary */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
        {note.summary || note.transcription?.substring(0, 100)}
      </p>
      
      {/* Tags, Folder and date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          {note.folder && (
            <span 
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium"
              style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.15)' }}
            >
              <Folder className="w-2.5 h-2.5" />
              {note.folder}
            </span>
          )}
          {noteTags.slice(0, 2).map(tag => (
            <TagBadge key={tag.name} tag={tag} />
          ))}
          {noteTags.length > 2 && <span className="text-[10px] text-muted-foreground">+{noteTags.length - 2}</span>}
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(note.created_at)}</span>
      </div>
    </div>
  )
}

// 15 Bright and vibrant tag colors
const TAG_COLOR_PALETTE = {
  coral: { bg: 'hsl(16, 85%, 94%)', text: 'hsl(16, 80%, 40%)', border: 'hsl(16, 75%, 85%)', dot: 'hsl(16, 85%, 58%)' },
  tangerine: { bg: 'hsl(32, 90%, 92%)', text: 'hsl(28, 85%, 38%)', border: 'hsl(32, 80%, 82%)', dot: 'hsl(32, 90%, 55%)' },
  sunshine: { bg: 'hsl(48, 95%, 90%)', text: 'hsl(42, 80%, 35%)', border: 'hsl(48, 85%, 78%)', dot: 'hsl(48, 95%, 52%)' },
  lime: { bg: 'hsl(82, 70%, 90%)', text: 'hsl(82, 60%, 32%)', border: 'hsl(82, 60%, 78%)', dot: 'hsl(82, 70%, 48%)' },
  mint: { bg: 'hsl(158, 60%, 90%)', text: 'hsl(158, 55%, 32%)', border: 'hsl(158, 50%, 78%)', dot: 'hsl(158, 60%, 45%)' },
  teal: { bg: 'hsl(175, 55%, 90%)', text: 'hsl(175, 55%, 30%)', border: 'hsl(175, 50%, 78%)', dot: 'hsl(175, 55%, 42%)' },
  sky: { bg: 'hsl(198, 80%, 92%)', text: 'hsl(198, 70%, 35%)', border: 'hsl(198, 70%, 82%)', dot: 'hsl(198, 80%, 52%)' },
  azure: { bg: 'hsl(212, 75%, 93%)', text: 'hsl(212, 70%, 38%)', border: 'hsl(212, 65%, 84%)', dot: 'hsl(212, 75%, 55%)' },
  lavender: { bg: 'hsl(258, 65%, 94%)', text: 'hsl(258, 55%, 42%)', border: 'hsl(258, 55%, 85%)', dot: 'hsl(258, 65%, 60%)' },
  violet: { bg: 'hsl(280, 60%, 94%)', text: 'hsl(280, 55%, 40%)', border: 'hsl(280, 50%, 85%)', dot: 'hsl(280, 60%, 58%)' },
  magenta: { bg: 'hsl(320, 65%, 93%)', text: 'hsl(320, 55%, 40%)', border: 'hsl(320, 55%, 84%)', dot: 'hsl(320, 65%, 55%)' },
  rose: { bg: 'hsl(345, 70%, 93%)', text: 'hsl(345, 60%, 40%)', border: 'hsl(345, 60%, 84%)', dot: 'hsl(345, 70%, 55%)' },
  ruby: { bg: 'hsl(355, 70%, 93%)', text: 'hsl(355, 60%, 38%)', border: 'hsl(355, 60%, 84%)', dot: 'hsl(355, 70%, 52%)' },
  garnet: { bg: 'hsl(355, 55%, 94%)', text: 'hsl(355, 50%, 38%)', border: 'hsl(355, 48%, 85%)', dot: 'hsl(355, 55%, 48%)' },
  slate: { bg: 'hsl(220, 20%, 94%)', text: 'hsl(220, 25%, 40%)', border: 'hsl(220, 18%, 85%)', dot: 'hsl(220, 22%, 55%)' },
}

// Helper function to get tag color
const getTagColor = (color) => {
  const style = TAG_COLOR_PALETTE[color] || TAG_COLOR_PALETTE.coral
  return style.dot
}

// Note Row (List View)
const NoteRow = ({ note, onClick, onDelete, onStar, allTags }) => {
  const [showActions, setShowActions] = useState(false)
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  
  // Convert tag strings to objects with colors from allTags
  const noteTags = (note.tags || []).map(tagName => {
    const tagConfig = allTags.find(at => at.name === tagName)
    return { name: tagName, color: tagConfig?.color || 'slate' }
  })
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className="group flex items-center gap-4 px-4 py-3 rounded-xl border border-border bg-card cursor-pointer transition-smooth hover:shadow-md hover:border-primary/30"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {note.starred && <Star className="w-3 h-3 fill-primary text-primary flex-shrink-0" />}
          <h3 className="font-medium text-sm text-foreground truncate">{note.title}</h3>
        </div>
        <p className="text-xs text-muted-foreground truncate">{note.summary || note.transcription?.substring(0, 80)}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {noteTags.slice(0, 2).map(tag => <TagBadge key={tag.name} tag={tag} />)}
      </div>
      <span className="text-[11px] text-muted-foreground w-16 text-right flex-shrink-0">{formatDate(note.created_at)}</span>
      <div className={`flex items-center gap-0.5 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={(e) => { e.stopPropagation(); onStar(note.id, !note.starred); }} className="p-1.5 rounded-lg hover:bg-secondary">
          <Star className={`w-3.5 h-3.5 ${note.starred ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10">
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </div>
  )
}

// Formatted Smartified Text Component
const SmartifiedTextDisplay = ({ text, isEditing, onTextChange }) => {
  if (isEditing) {
    return (
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        className="w-full min-h-[300px] p-4 rounded-xl bg-secondary/30 border border-border text-base leading-relaxed font-mono resize-none focus:outline-none focus:border-primary/50 transition-colors"
        placeholder="Edit your smartified text..."
      />
    )
  }
  
  // Parse and render the structured smartified text
  const renderFormattedText = (content) => {
    if (!content) return null
    
    const lines = content.split('\n')
    const elements = []
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      
      // Skip empty lines but add spacing
      if (!trimmedLine) {
        elements.push(<div key={index} className="h-2" />)
        return
      }
      
      // Check if it's an ALL CAPS HEADING (2+ words, all uppercase)
      if (/^[A-Z][A-Z\s]{2,}$/.test(trimmedLine) && trimmedLine.split(' ').length <= 5) {
        elements.push(
          <h2 key={index} className="text-lg font-bold text-foreground mt-6 mb-3 first:mt-0">
            {trimmedLine}
          </h2>
        )
        return
      }
      
      // Check if it's a **Subheading** (bold with **)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        const subheadingText = trimmedLine.slice(2, -2)
        elements.push(
          <h3 key={index} className="text-base font-semibold text-foreground/80 mt-4 mb-2">
            {subheadingText}
          </h3>
        )
        return
      }
      
      // Check if it's a bullet point
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        const bulletText = trimmedLine.replace(/^[•\-*]\s*/, '')
        elements.push(
          <div key={index} className="flex items-start gap-3 py-1.5 pl-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            <span className="text-base text-foreground/80 leading-relaxed">{bulletText}</span>
          </div>
        )
        return
      }
      
      // Regular paragraph text
      elements.push(
        <p key={index} className="text-base text-foreground/80 leading-relaxed py-1">
          {trimmedLine}
        </p>
      )
    })
    
    return elements
  }
  
  return (
    <div className="prose prose-sm max-w-none">
      {renderFormattedText(text)}
    </div>
  )
}

// Note Detail View - Full width immersive experience
const NoteDetailView = ({ 
  note, 
  onClose, 
  onDelete, 
  onAddTag, 
  onRemoveTag, 
  onAddToFolder, 
  onUpdateNote,
  allTags, 
  folders, 
  userId, 
  onStartRecording, 
  isRecording, 
  isProcessing, 
  recordingDuration, 
  onStopRecording, 
  searchQuery, 
  setSearchQuery, 
  searchResults, 
  showSearchResults, 
  setShowSearchResults, 
  onSelectSearchResult 
}) => {
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  
  // Default to smartified view
  const [textMode, setTextMode] = useState('smart')
  
  // Editing states
  const [isEditing, setIsEditing] = useState(false)
  const [editedRawText, setEditedRawText] = useState(note.transcription || '')
  const [editedSmartText, setEditedSmartText] = useState(note.smartified_text || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  const chatEndRef = useRef(null)
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])
  
  // Initialize edited text when note changes
  useEffect(() => {
    setEditedRawText(note.transcription || '')
    setEditedSmartText(note.smartified_text || '')
    setHasUnsavedChanges(false)
    setIsEditing(false)
  }, [note.id])
  
  // Track changes
  const handleTextChange = (newText) => {
    if (textMode === 'smart') {
      setEditedSmartText(newText)
      setHasUnsavedChanges(newText !== note.smartified_text)
    } else {
      setEditedRawText(newText)
      setHasUnsavedChanges(newText !== note.transcription)
    }
  }
  
  // Save transcript changes
  const saveChanges = async () => {
    setIsSaving(true)
    try {
      const updateData = textMode === 'smart' 
        ? { smartified_text: editedSmartText }
        : { transcription: editedRawText }
      
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      
      if (!response.ok) throw new Error('Failed to save')
      
      const data = await response.json()
      
      // Update parent state
      if (onUpdateNote) {
        onUpdateNote(data.note)
      }
      
      setHasUnsavedChanges(false)
      setIsEditing(false)
      toast.success('Changes saved')
      
      // Prompt to regenerate AI content
      toast('Regenerate AI Summary?', {
        description: 'Update summary and key points based on your edits',
        action: {
          label: 'Regenerate',
          onClick: () => regenerateAIContent()
        },
        duration: 5000
      })
    } catch (error) {
      toast.error('Failed to save changes')
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }
  
  // Regenerate AI Summary and Key Points
  const regenerateAIContent = async () => {
    setIsRegenerating(true)
    try {
      // Use the smartified text if available, otherwise raw transcription
      const contentToAnalyze = editedSmartText || editedRawText
      
      const response = await fetch('/api/regenerate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: note.id,
          transcription: contentToAnalyze,
          userId
        })
      })
      
      if (!response.ok) throw new Error('Failed to regenerate')
      
      const data = await response.json()
      
      // Update parent state with new summary and key points
      if (onUpdateNote) {
        onUpdateNote(data.note)
      }
      
      toast.success('AI content regenerated')
    } catch (error) {
      toast.error('Failed to regenerate AI content')
      console.error('Regenerate error:', error)
    } finally {
      setIsRegenerating(false)
    }
  }
  
  // Cancel editing
  const cancelEditing = () => {
    setEditedRawText(note.transcription || '')
    setEditedSmartText(note.smartified_text || '')
    setHasUnsavedChanges(false)
    setIsEditing(false)
  }
  
  // Convert tag strings to objects with colors from allTags
  const noteTags = (note.tags || []).map(tagName => {
    const tagConfig = allTags.find(at => at.name === tagName)
    return { name: tagName, color: tagConfig?.color || 'slate' }
  })
  
  const copyTranscription = () => {
    const textToCopy = textMode === 'smart' ? (editedSmartText || note.transcription) : editedRawText
    navigator.clipboard.writeText(textToCopy)
    toast.success('Copied to clipboard')
  }
  
  const sendMessage = async () => {
    if (!chatInput.trim()) return
    const userMsg = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setIsChatLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...chatMessages, userMsg], 
          userId, 
          contextScope: {
            type: 'note',
            noteId: note.id,
            noteTitle: note.title
          }
        })
      })
      const data = await response.json()
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.message, sources: data.sources }])
    } catch (error) {
      toast.error('Failed to send message')
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setIsChatLoading(false)
    }
  }
  
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }
  
  const formatDuration = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  
  const getTagStyle = (color) => {
    const colors = {
      rose: { bg: 'hsl(350, 60%, 94%)', text: 'hsl(350, 60%, 40%)', border: 'hsl(350, 55%, 85%)', dot: 'hsl(350, 65%, 55%)' },
      amber: { bg: 'hsl(38, 75%, 92%)', text: 'hsl(32, 70%, 35%)', border: 'hsl(38, 70%, 82%)', dot: 'hsl(38, 80%, 50%)' },
      emerald: { bg: 'hsl(160, 45%, 92%)', text: 'hsl(160, 50%, 32%)', border: 'hsl(160, 45%, 82%)', dot: 'hsl(160, 50%, 45%)' },
      sapphire: { bg: 'hsl(220, 70%, 94%)', text: 'hsl(220, 80%, 40%)', border: 'hsl(220, 70%, 85%)', dot: 'hsl(220, 80%, 55%)' },
      violet: { bg: 'hsl(270, 50%, 94%)', text: 'hsl(270, 55%, 42%)', border: 'hsl(270, 45%, 85%)', dot: 'hsl(270, 55%, 55%)' },
      slate: { bg: 'hsl(215, 20%, 93%)', text: 'hsl(215, 25%, 40%)', border: 'hsl(215, 20%, 85%)', dot: 'hsl(215, 25%, 55%)' },
    }
    return colors[color] || colors.slate
  }
  
  // Folder label style
  const folderStyle = {
    bg: 'hsl(220, 70%, 94%)',
    text: 'hsl(220, 80%, 40%)',
    border: 'hsl(220, 70%, 85%)'
  }
  
  // Determine what text to show
  const displaySmartText = editedSmartText || note.smartified_text || ''
  const displayRawText = editedRawText || note.transcription || ''
  
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Fixed Header with Search */}
      <header className="px-6 py-4 border-b border-border bg-card flex items-center gap-4">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-smooth flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        
        {/* Centered Search - same as dashboard */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notes, tags, keywords..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true) }}
              onFocus={() => setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              className="pl-11 h-10 bg-secondary/50 border-border rounded-xl text-sm w-full"
            />
            {showSearchResults && searchResults.length > 0 && (
              <SearchResults results={searchResults} onSelect={onSelectSearchResult} onClose={() => { setSearchQuery(''); setShowSearchResults(false) }} />
            )}
          </div>
        </div>
        
        {/* Copy button */}
        <button 
          onClick={copyTranscription}
          className="p-2 rounded-lg hover:bg-secondary transition-smooth flex-shrink-0"
          title="Copy transcription"
        >
          <Copy className="w-4 h-4 text-muted-foreground" />
        </button>
      </header>
      
      {/* Main Content - Full Width */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Note Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{note.title}</h1>
                <p className="text-sm text-muted-foreground">{formatDate(note.created_at)}</p>
              </div>
            </div>
            
            {/* Tags and Folder */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Folder label */}
              {note.folder ? (
                <DropdownMenu open={showFolderPicker} onOpenChange={setShowFolderPicker}>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-medium transition-smooth hover:opacity-80"
                      style={{ backgroundColor: folderStyle.bg, color: folderStyle.text, border: `1px solid ${folderStyle.border}` }}
                    >
                      <Folder className="w-3 h-3" />
                      {note.folder}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {folders.map(f => (
                      <DropdownMenuItem key={f} onClick={() => { onAddToFolder(note.id, f); setShowFolderPicker(false); }} className="gap-2">
                        <Folder className="w-3.5 h-3.5 folder-icon" />
                        <span className="font-medium">{f}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <DropdownMenu open={showFolderPicker} onOpenChange={setShowFolderPicker}>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-smooth">
                      <Folder className="w-3 h-3" /> Add to folder
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {folders.map(f => (
                      <DropdownMenuItem key={f} onClick={() => { onAddToFolder(note.id, f); setShowFolderPicker(false); }} className="gap-2">
                        <Folder className="w-3.5 h-3.5 folder-icon" />
                        <span className="font-medium">{f}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* Tags */}
              {noteTags.map(tag => {
                const style = getTagStyle(tag.color)
                return (
                  <span 
                    key={tag.name}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-medium"
                    style={{ backgroundColor: style.bg, color: style.text, border: `1px solid ${style.border}` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
                    {tag.name}
                    <button onClick={() => onRemoveTag(note.id, tag.name)} className="ml-0.5 hover:opacity-70">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )
              })}
              
              {/* Add Tag */}
              <DropdownMenu open={showTagPicker} onOpenChange={setShowTagPicker}>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-smooth">
                    <Tag className="w-3 h-3" /> Add tag
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  {allTags.filter(t => !noteTags.find(nt => nt.name === t.name)).map(tag => (
                    <DropdownMenuItem key={tag.name} onClick={() => { onAddTag(note.id, tag); setShowTagPicker(false); }} className="gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getTagStyle(tag.color).dot }} />
                      <span className="font-medium">{tag.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Fixed Content: AI Summary - NOT EDITABLE */}
          {note.summary && (
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-accent/10 border border-primary/10 mb-8 relative">
              {isRegenerating && (
                <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Regenerating...</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary">AI Summary</span>
              </div>
              <p className="text-base text-foreground/90 leading-relaxed">{note.summary}</p>
            </div>
          )}
          
          {/* Fixed Content: Key Points - NOT EDITABLE */}
          {note.key_points?.length > 0 && (
            <div className="mb-8 relative">
              {isRegenerating && (
                <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                </div>
              )}
              <h3 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wide">Key Points</h3>
              <ul className="space-y-3">
                {note.key_points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                    <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <span className="text-sm text-foreground/80 leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Toggleable & Editable Transcription Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Transcription</h3>
              
              <div className="flex items-center gap-2">
                {/* Edit/Save buttons */}
                {isEditing ? (
                  <div className="flex items-center gap-2 mr-4">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={cancelEditing}
                      className="h-8 px-3 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={saveChanges}
                      disabled={isSaving || !hasUnsavedChanges}
                      className="h-8 px-3 text-xs gap-1.5"
                    >
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setIsEditing(true)}
                    className="h-8 px-3 text-xs gap-1.5 mr-4"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </Button>
                )}
                
                {/* Text Mode Toggle */}
                <div className="flex items-center bg-secondary/50 rounded-lg p-1">
                  <button 
                    onClick={() => setTextMode('smart')} 
                    className={`px-3 py-1.5 text-xs rounded-md transition-smooth font-medium ${textMode === 'smart' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Sparkles className="w-3 h-3 inline mr-1.5" />Smartified
                  </button>
                  <button 
                    onClick={() => setTextMode('raw')} 
                    className={`px-3 py-1.5 text-xs rounded-md transition-smooth font-medium ${textMode === 'raw' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <FileText className="w-3 h-3 inline mr-1.5" />Raw
                  </button>
                </div>
              </div>
            </div>
            
            {/* Unsaved changes indicator */}
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 mb-3 text-amber-600 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Unsaved changes
              </div>
            )}
            
            {textMode === 'smart' ? (
              displaySmartText ? (
                <div className="rounded-xl bg-secondary/20 border border-border p-6">
                  <SmartifiedTextDisplay 
                    text={isEditing ? editedSmartText : displaySmartText}
                    isEditing={isEditing}
                    onTextChange={handleTextChange}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-secondary/30 border border-border text-center">
                  <Sparkles className="w-8 h-8 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">No smartified version available</p>
                  <p className="text-xs text-muted-foreground/70">Switch to Raw view to see the original transcription</p>
                </div>
              )
            ) : (
              <div className="p-6 rounded-xl bg-muted/30 border border-border">
                {isEditing ? (
                  <textarea
                    value={editedRawText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="w-full min-h-[300px] p-0 bg-transparent text-base leading-relaxed resize-none focus:outline-none"
                    placeholder="Edit your transcription..."
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Format raw text into readable paragraphs */}
                    {displayRawText.split(/\n\n+/).map((paragraph, idx) => (
                      <p key={idx} className="text-base text-foreground leading-relaxed">
                        {paragraph.split(/\n/).map((line, lineIdx) => (
                          <span key={lineIdx}>
                            {lineIdx > 0 && <br />}
                            {line}
                          </span>
                        ))}
                      </p>
                    ))}
                    {!displayRawText && (
                      <p className="text-muted-foreground italic">No transcription available</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Regenerate AI Button */}
            {!isEditing && (
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={regenerateAIContent}
                  disabled={isRegenerating}
                  className="h-8 px-3 text-xs gap-1.5"
                >
                  {isRegenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Regenerate AI Summary
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Fixed Bottom Controls - Mic stays fixed, Chat expands independently */}
      <div className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-screen-xl mx-auto px-6 flex items-end justify-center gap-3">
          {/* Recording Button - Fixed position on left */}
          <div className="pointer-events-auto">
            {isRecording || isProcessing ? (
              <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-card border border-border shadow-xl animate-record-appear">
                {isRecording ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    <span className="text-sm font-medium tabular-nums">{formatDuration(recordingDuration)}</span>
                    <Waveform />
                    <button onClick={onStopRecording} className="ml-2 p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-smooth">
                      <Square className="w-3 h-3 fill-current" />
                    </button>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm">Processing...</span>
                  </>
                )}
              </div>
            ) : (
              <button onClick={onStartRecording} className="p-3.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-smooth hover:scale-105">
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Chat Bar - Note-scoped context */}
          <div className="pointer-events-auto">
            {!isChatExpanded ? (
              <div onClick={() => setIsChatExpanded(true)} className="flex items-center gap-4 px-6 py-3.5 rounded-2xl bg-card border border-emerald-200 shadow-lg cursor-pointer hover:shadow-xl hover:border-emerald-300 transition-smooth" style={{ minWidth: '550px' }}>
                <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-sm text-muted-foreground flex-1">Ask about this note...</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">Note Scope</span>
                <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            ) : (
              <div className="bg-card border border-emerald-200 rounded-2xl shadow-xl animate-slide-up overflow-hidden" style={{ width: '550px' }}>
                <div className="flex items-center justify-between px-4 py-3 border-b bg-emerald-50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-sm font-medium text-emerald-800">Focused on: {note.title?.substring(0, 30)}{note.title?.length > 30 ? '...' : ''}</span>
                      <p className="text-[10px] text-emerald-600">I can only see this note&apos;s content</p>
                    </div>
                  </div>
                  <button onClick={() => setIsChatExpanded(false)} className="p-1.5 rounded-lg hover:bg-emerald-100 transition-smooth">
                    <X className="w-4 h-4 text-emerald-700" />
                  </button>
                </div>
                <ScrollArea className="h-64 px-4 py-3">
                  <div className="space-y-3">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                          <MessageCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <p className="text-sm text-muted-foreground">Ask questions about this specific note</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">&quot;What are the key takeaways?&quot; or &quot;Summarize the action items&quot;</p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                        <div className={msg.role === 'user' ? 'max-w-[85%] px-3 py-2 rounded-xl text-sm bg-primary text-primary-foreground' : 'max-w-[85%] px-3 py-2 rounded-xl text-sm bg-secondary'}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex">
                        <div className="bg-secondary px-3 py-2 rounded-xl flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs text-muted-foreground">Analyzing note...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>
                <div className="px-4 py-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ask about this note..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-emerald-300"
                      autoFocus
                    />
                    <Button size="sm" onClick={sendMessage} disabled={!chatInput.trim() || isChatLoading} className="h-9 px-4">
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Context-Aware Chat Bar Component - handles all scopes
const ContextAwareChatBar = ({ userId, contextScope, isExpanded, onToggle, noteCount }) => {
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
          userId,
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
        style={{ minWidth: '560px' }}
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
    <div className={`bg-card border rounded-2xl shadow-xl animate-slide-up overflow-hidden ${scopeDisplay.borderColor}`} style={{ width: '600px' }}>
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
const GlobalChatBar = ({ userId, isExpanded, onToggle, contextScope, noteCount }) => {
  return (
    <ContextAwareChatBar 
      userId={userId}
      contextScope={contextScope || { type: 'global' }}
      isExpanded={isExpanded}
      onToggle={onToggle}
      noteCount={noteCount}
    />
  )
}

// Section component for brain dump categories (extracted to avoid nested component issues)
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
const BrainDumpView = ({ userId, contextScope, onNoteClick, noteCount }) => {
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
        body: JSON.stringify({ userId, contextScope, forceRefresh })
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
  }, [userId, contextScope])
  
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

// View Mode Toggle - Notes vs Brain Dump
// View Mode Toggle - Notes vs Brain Dump (Premium style with smooth transitions)
const ViewModeToggle = ({ mode, onChange }) => {
  return (
    <div className="inline-flex items-center bg-secondary/50 rounded-xl p-1 relative">
      {/* Sliding background indicator */}
      <div 
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-card rounded-lg shadow-sm transition-all duration-200 ease-out ${
          mode === 'brain-dump' ? 'left-[calc(50%+2px)]' : 'left-1'
        }`}
      />
      <button 
        onClick={() => onChange('notes')} 
        className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors duration-200 font-medium z-10 ${
          mode === 'notes' 
            ? 'text-foreground' 
            : 'text-muted-foreground hover:text-foreground/70'
        }`}
      >
        <FileText className="w-3.5 h-3.5" />
        Notes
      </button>
      <button 
        onClick={() => onChange('brain-dump')} 
        className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors duration-200 font-medium z-10 ${
          mode === 'brain-dump' 
            ? 'text-foreground' 
            : 'text-muted-foreground hover:text-foreground/70'
        }`}
      >
        <Brain className="w-3.5 h-3.5" />
        Brain Dump
      </button>
    </div>
  )
}

// Settings Modal with Clear Data and Delete Account
const SettingsModal = ({ open, onClose, user, profile, onLogout, onClearData, onDeleteAccount }) => {
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
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
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
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Danger Zone</p>
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
          <div className="space-y-4 py-4">
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
          <div className="space-y-4 py-4">
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

// Create Tag Modal
const CreateTagModal = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('')
  
  // Auto-assign a random color from the available palette
  const getRandomColor = () => {
    const colors = ['garnet', 'sage', 'amber', 'terracotta', 'slate', 'plum', 'violet', 'emerald']
    return colors[Math.floor(Math.random() * colors.length)]
  }
  
  const handleCreate = () => {
    if (name.trim()) {
      const tagName = name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-')
      onCreate({ name: tagName, color: getRandomColor() })
      setName('')
      onClose()
    }
  }
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && name.trim()) {
      handleCreate()
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Tag</DialogTitle>
          <DialogDescription>Add a new tag to organize your notes</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input 
                placeholder="Enter tag name..." 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                onKeyDown={handleKeyDown}
                className="pl-9 h-11"
                autoFocus
              />
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              Press Enter to create • Color will be auto-assigned
            </p>
          </div>
          
          {name.trim() && (
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
              <p className="text-[10px] text-muted-foreground/60 mb-2">Preview</p>
              <TagBadge tag={{ name: name.toLowerCase().replace(/[^a-z0-9-_]/g, '-'), color: 'garnet' }} size="md" />
            </div>
          )}
          
          <Button onClick={handleCreate} disabled={!name.trim()} className="w-full h-10">
            <Plus className="w-4 h-4 mr-1.5" />
            Create Tag
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Create Folder Modal
const CreateFolderModal = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('')
  const handleCreate = () => { if (name.trim()) { onCreate(name.trim()); setName(''); onClose() } }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Create Folder</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <Input placeholder="Folder name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
          <Button onClick={handleCreate} disabled={!name.trim()} className="w-full">Create Folder</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main Dashboard
export default function Dashboard() {
  const router = useRouter()
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authUser, setAuthUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  
  // Use authenticated user ID if available, otherwise demo user for backward compatibility
  const [userId, setUserId] = useState(null)
  const [activeView, setActiveView] = useState('notes')
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [selectedTag, setSelectedTag] = useState(null)
  const [filter, setFilter] = useState('recent')
  const [viewMode, setViewMode] = useState('grid')
  const [viewType, setViewType] = useState('notes') // 'notes' or 'brain-dump'
  
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [notes, setNotes] = useState([])
  const [todos, setTodos] = useState([])
  const [allTags, setAllTags] = useState(getStoredTags)
  const [folders, setFolders] = useState(getStoredFolders)
  const [selectedNote, setSelectedNote] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false)
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)
  const streamRef = useRef(null)
  
  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // No authenticated user, redirect to auth
        router.push('/auth')
        return
      }
      
      setAuthUser(user)
      setUserId(user.id)
      
      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (profile) {
        setUserProfile(profile)
        
        // Check if onboarding is completed
        if (!profile.onboarding_completed) {
          router.push('/onboarding')
          return
        }
        
        // Check if subscription is active
        if (profile.subscription_status !== 'active') {
          router.push('/subscribe')
          return
        }
      } else {
        // No profile exists yet, send to onboarding
        router.push('/onboarding')
        return
      }
      
      setIsAuthLoading(false)
    }
    
    checkAuth()
  }, [router])
  
  // Fetch data after auth is confirmed
  useEffect(() => {
    if (!isAuthLoading && userId) {
      fetchNotes()
      fetchTodos()
    }
  }, [isAuthLoading, userId])
  
  // State for focus items section
  const [focusItemsExpanded, setFocusItemsExpanded] = useState(true)
  const [intents, setIntents] = useState([])
  
  // Fetch intents (focus items) after auth
  useEffect(() => {
    const fetchIntents = async () => {
      if (!userId) return
      try {
        const response = await fetch(`/api/intents?userId=${userId}&limit=5`)
        if (response.ok) {
          const data = await response.json()
          setIntents(data.intents || [])
        }
      } catch (error) {
        console.error('Failed to fetch intents:', error)
      }
    }
    if (!isAuthLoading && userId) {
      fetchIntents()
    }
  }, [isAuthLoading, userId])
  
  // Get dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }
  
  // Get user's first name
  const getUserFirstName = () => {
    const fullName = userProfile?.full_name || authUser?.user_metadata?.full_name || 'there'
    return fullName.split(' ')[0]
  }
  
  // Count unresolved todos
  const unresolvedTodosCount = todos.filter(t => !t.completed).length
  
  // Logout handler
  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }
  
  // Clear All Data handler
  const handleClearAllData = async () => {
    if (!userId) return
    
    try {
      const response = await fetch('/api/user/clear-all-data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear data')
      }
      
      // Clear local state
      setNotes([])
      setTodos([])
      setSelectedNote(null)
      setSelectedFolder(null)
      setSelectedTag(null)
      
      toast.success('All data cleared successfully')
    } catch (error) {
      console.error('Clear data error:', error)
      toast.error(error.message || 'Failed to clear data')
      throw error
    }
  }
  
  // Delete Account handler
  const handleDeleteAccount = async () => {
    if (!userId) return
    
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }
      
      // Sign out locally and redirect
      const supabase = createClient()
      await supabase.auth.signOut()
      
      toast.success('Account deleted successfully')
      router.push('/auth')
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error(error.message || 'Failed to delete account')
      throw error
    }
  }
  // Removed the dependency on selectedTag/selectedFolder since filtering happens in displayNotes
  
  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return notes.filter(n => 
      n.title?.toLowerCase().includes(q) ||
      n.transcription?.toLowerCase().includes(q) ||
      n.summary?.toLowerCase().includes(q) ||
      n.smartified_text?.toLowerCase().includes(q) ||
      n.tags?.some(t => t.toLowerCase().includes(q))
    ).slice(0, 8)
  }, [searchQuery, notes])
  
  // Sync tags from notes to sidebar - discover tags from backend data
  useEffect(() => {
    if (notes.length === 0) return
    
    // Extract all unique tags from notes
    const tagsFromNotes = new Set()
    notes.forEach(n => {
      (n.tags || []).forEach(tag => tagsFromNotes.add(tag))
    })
    
    // Merge with existing tags (preserving colors)
    let needsUpdate = false
    const updatedTags = [...allTags]
    
    tagsFromNotes.forEach(tagName => {
      if (!updatedTags.find(t => t.name === tagName)) {
        // New tag discovered from backend - assign default color
        updatedTags.push({ name: tagName, color: 'slate' })
        needsUpdate = true
      }
    })
    
    if (needsUpdate) {
      setAllTags(updatedTags)
      saveStoredTags(updatedTags)
    }
  }, [notes])
  
  // Similarly, sync folders from notes
  useEffect(() => {
    if (notes.length === 0) return
    
    // Extract all unique folders from notes
    const foldersFromNotes = new Set()
    notes.forEach(n => {
      if (n.folder) foldersFromNotes.add(n.folder)
    })
    
    // Merge with existing folders
    let needsUpdate = false
    const updatedFolders = [...folders]
    
    foldersFromNotes.forEach(folderName => {
      if (!updatedFolders.includes(folderName)) {
        updatedFolders.push(folderName)
        needsUpdate = true
      }
    })
    
    if (needsUpdate) {
      setFolders(updatedFolders)
      saveStoredFolders(updatedFolders)
    }
  }, [notes])
  
  // Fetch all notes (unfiltered) - filtering happens in displayNotes
  const fetchNotes = async () => {
    try {
      const params = new URLSearchParams({ userId })
      const response = await fetch(`/api/notes?${params}`)
      const data = await response.json()
      setNotes(data.notes || [])
    } catch (error) { console.error('Error fetching notes:', error) }
  }
  
  const fetchTodos = async () => {
    try {
      const response = await fetch(`/api/todos?userId=${userId}`)
      const data = await response.json()
      setTodos(data.todos || [])
    } catch (error) { console.error('Error:', error) }
  }
  
  const getOptimalMimeType = () => {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/wav']
    for (const type of types) { if (MediaRecorder.isTypeSupported(type)) return type }
    return 'audio/webm'
  }
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: getOptimalMimeType() })
      audioChunksRef.current = []
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mediaRecorderRef.current.onstop = handleRecordingComplete
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingDuration(0)
      const startTime = Date.now()
      recordingTimerRef.current = setInterval(() => { setRecordingDuration(Math.floor((Date.now() - startTime) / 1000)) }, 1000)
    } catch (error) { toast.error('Please allow microphone access') }
  }
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      setIsRecording(false)
    }
  }
  
  const handleRecordingComplete = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: getOptimalMimeType() })
    if (audioBlob.size < 1000) { toast.error('Recording too short'); return }
    setIsProcessing(true)
    try {
      // Step 1: Transcribe with Deepgram
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      const transcribeRes = await fetch('/api/transcribe', { method: 'POST', body: formData })
      if (!transcribeRes.ok) throw new Error('Transcription failed')
      const transcribeData = await transcribeRes.json()
      if (!transcribeData.transcription) throw new Error('No speech detected')
      
      toast.info('Transcription complete, generating AI insights...')
      
      // Step 2: Extract insights (title, summary, key points, action items)
      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: transcribeData.transcription, userId })
      })
      if (!extractRes.ok) throw new Error('Extraction failed')
      const extractData = await extractRes.json()
      
      toast.info('Generating smartified transcript...')
      
      // Step 3: Smartify the transcript (ONE TIME at creation)
      const smartifyRes = await fetch('/api/smartify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: transcribeData.transcription })
      })
      let smartifiedText = null
      if (smartifyRes.ok) {
        const smartifyData = await smartifyRes.json()
        smartifiedText = smartifyData.smartified
      }
      
      // Step 4: Save note with all data including smartified text
      const saveRes = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: extractData.extracted?.title || 'Voice Note',
          transcription: transcribeData.transcription,
          smartifiedText: smartifiedText,
          summary: extractData.extracted?.summary || '',
          keyPoints: extractData.extracted?.key_points || [],
          actionItems: extractData.extracted?.action_items || [],
          tags: []
        })
      })
      if (!saveRes.ok) throw new Error('Save failed')
      const savedNote = await saveRes.json()
      toast.success('Note saved')
      await Promise.all([fetchNotes(), fetchTodos()])
      
      // Auto-navigate to the newly created note
      if (savedNote.note) {
        setSelectedNote(savedNote.note)
      }
    } catch (error) { 
      toast.error(error.message || 'Failed to save') 
      console.error('Recording complete error:', error)
    }
    finally { setIsProcessing(false) }
  }
  
  const deleteNote = async (noteId) => {
    try {
      await fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
      toast.success('Note deleted')
      setSelectedNote(null)
      fetchNotes()
      fetchTodos()
    } catch (error) { toast.error('Failed to delete') }
  }
  
  const toggleStar = async (noteId, starred) => {
    // Optimistic update
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, starred } : n))
    if (selectedNote?.id === noteId) setSelectedNote(prev => ({ ...prev, starred }))
    
    // Persist to backend
    try {
      await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred })
      })
    } catch (error) {
      // Revert on error
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, starred: !starred } : n))
      toast.error('Failed to update')
    }
  }
  
  const addTagToNote = async (noteId, tag) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    
    const existingTags = note.tags || []
    // Tags are stored as strings
    if (existingTags.includes(tag.name)) {
      toast.info('Tag already added')
      return
    }
    
    const newTags = [...existingTags, tag.name]
    
    // Optimistic update
    setNotes(prev => prev.map(n => n.id !== noteId ? n : { ...n, tags: newTags }))
    if (selectedNote?.id === noteId) setSelectedNote(prev => ({ ...prev, tags: newTags }))
    
    // Add tag to sidebar if it's new
    if (!allTags.find(t => t.name === tag.name)) { 
      const updatedTags = [...allTags, tag]
      setAllTags(updatedTags)
      saveStoredTags(updatedTags) 
    }
    
    // Persist to backend
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save tag')
      }
      
      const data = await response.json()
      
      // Update with server response to ensure consistency
      if (data.note) {
        setNotes(prev => prev.map(n => n.id !== noteId ? n : data.note))
        if (selectedNote?.id === noteId) setSelectedNote(data.note)
      }
      
      toast.success('Tag added')
    } catch (error) {
      // Revert on error
      setNotes(prev => prev.map(n => n.id !== noteId ? n : { ...n, tags: existingTags }))
      if (selectedNote?.id === noteId) setSelectedNote(prev => ({ ...prev, tags: existingTags }))
      toast.error('Failed to add tag')
      console.error('Add tag error:', error)
    }
  }
  
  const removeTagFromNote = async (noteId, tagName) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    
    const existingTags = note.tags || []
    const newTags = existingTags.filter(t => t !== tagName)
    
    // Optimistic update
    setNotes(prev => prev.map(n => n.id !== noteId ? n : { ...n, tags: newTags }))
    if (selectedNote?.id === noteId) setSelectedNote(prev => ({ ...prev, tags: newTags }))
    
    // Persist to backend
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags })
      })
      
      if (!response.ok) {
        throw new Error('Failed to remove tag')
      }
      
      const data = await response.json()
      
      // Update with server response to ensure consistency
      if (data.note) {
        setNotes(prev => prev.map(n => n.id !== noteId ? n : data.note))
        if (selectedNote?.id === noteId) setSelectedNote(data.note)
      }
      
      toast.success('Tag removed')
    } catch (error) {
      // Revert on error
      setNotes(prev => prev.map(n => n.id !== noteId ? n : { ...n, tags: existingTags }))
      if (selectedNote?.id === noteId) setSelectedNote(prev => ({ ...prev, tags: existingTags }))
      toast.error('Failed to remove tag')
      console.error('Remove tag error:', error)
    }
  }
  
  const addToFolder = async (noteId, folder) => {
    if (!folder) return
    
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    
    const previousFolder = note.folder
    
    // Optimistic update
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, folder } : n))
    if (selectedNote?.id === noteId) setSelectedNote(prev => ({ ...prev, folder }))
    
    // Add folder to sidebar if it's new
    if (!folders.includes(folder)) { 
      const newFolders = [...folders, folder]
      setFolders(newFolders)
      saveStoredFolders(newFolders) 
    }
    
    // Persist to backend
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save folder')
      }
      
      const data = await response.json()
      
      // Update with server response to ensure consistency
      if (data.note) {
        setNotes(prev => prev.map(n => n.id !== noteId ? n : data.note))
        if (selectedNote?.id === noteId) setSelectedNote(data.note)
      }
      
      toast.success(`Moved to ${folder}`)
    } catch (error) {
      // Revert on error
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, folder: previousFolder } : n))
      if (selectedNote?.id === noteId) setSelectedNote(prev => ({ ...prev, folder: previousFolder }))
      toast.error('Failed to add to folder')
      console.error('Add to folder error:', error)
    }
  }
  
  // Update note in state (called from NoteDetailView after edits)
  const handleUpdateNote = (updatedNote) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n))
    setSelectedNote(updatedNote)
  }
  
  // Remove folder from note
  const removeFromFolder = async (noteId) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    
    const previousFolder = note.folder
    
    // Optimistic update
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, folder: null } : n))
    if (selectedNote?.id === noteId) setSelectedNote(prev => ({ ...prev, folder: null }))
    
    // Persist to backend
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: null })
      })
      
      if (!response.ok) throw new Error('Failed to remove from folder')
      
      const data = await response.json()
      if (data.note) {
        setNotes(prev => prev.map(n => n.id !== noteId ? n : data.note))
        if (selectedNote?.id === noteId) setSelectedNote(data.note)
      }
      
      toast.success(`Removed from ${previousFolder}`)
    } catch (error) {
      // Revert on error
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, folder: previousFolder } : n))
      if (selectedNote?.id === noteId) setSelectedNote(prev => ({ ...prev, folder: previousFolder }))
      toast.error('Failed to remove from folder')
    }
  }
  
  const createTag = (tag) => {
    if (!allTags.find(t => t.name === tag.name)) {
      const newTags = [...allTags, tag]; setAllTags(newTags); saveStoredTags(newTags)
      toast.success(`Tag created`)
    }
  }
  
  const createFolder = (name) => {
    if (!folders.includes(name)) {
      const newFolders = [...folders, name]; setFolders(newFolders); saveStoredFolders(newFolders)
      toast.success(`Folder created`)
    }
  }
  
  const toggleTodo = async (todoId, completed) => {
    try {
      await fetch(`/api/todos/${todoId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !completed }) })
      fetchTodos()
    } catch (error) { toast.error('Failed to update') }
  }
  
  const formatDuration = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const pendingTodos = todos.filter(t => !t.completed)
  
  // Apply filters based on current view (folder, tag, or starred)
  let displayNotes = notes
  
  // Filter by folder if one is selected
  if (selectedFolder) {
    displayNotes = displayNotes.filter(n => n.folder === selectedFolder)
  }
  
  // Filter by tag if one is selected
  if (selectedTag) {
    displayNotes = displayNotes.filter(n => n.tags?.includes(selectedTag))
  }
  
  // Filter by starred if that filter is active
  if (filter === 'starred') {
    displayNotes = displayNotes.filter(n => n.starred)
  }
  
  // Sort by date (newest first)
  displayNotes = [...displayNotes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  
  // Show loading state while checking auth
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (selectedNote) {
    return <NoteDetailView 
      note={selectedNote} 
      onClose={() => setSelectedNote(null)} 
      onDelete={deleteNote} 
      onAddTag={addTagToNote} 
      onRemoveTag={removeTagFromNote} 
      onAddToFolder={addToFolder}
      onUpdateNote={handleUpdateNote}
      allTags={allTags} 
      folders={folders}
      userId={userId} 
      onStartRecording={startRecording}
      isRecording={isRecording}
      isProcessing={isProcessing}
      recordingDuration={recordingDuration}
      onStopRecording={stopRecording}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      searchResults={searchResults}
      showSearchResults={showSearchResults}
      setShowSearchResults={setShowSearchResults}
      onSelectSearchResult={(note) => { setSelectedNote(note); setSearchQuery(''); setShowSearchResults(false); }}
    />
  }
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border bg-sidebar flex flex-col">
        <div className="px-4 py-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Founder Note</span>
          </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <NavItem icon={Home} label="All Notes" active={activeView === 'notes' && !selectedTag && !selectedFolder} onClick={() => { setActiveView('notes'); setSelectedTag(null); setSelectedFolder(null); }} count={notes.length} />
          <NavItem icon={CheckSquare} label="Action Items" active={activeView === 'todos'} onClick={() => setActiveView('todos')} count={pendingTodos.length} />
          
          <div className="pt-5">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Folders</p>
              <button onClick={() => setIsCreateFolderOpen(true)} className="p-0.5 rounded hover:bg-secondary"><Plus className="w-3 h-3 text-muted-foreground" /></button>
            </div>
            {folders.map(folder => (
              <button key={folder} onClick={() => { setSelectedFolder(folder); setSelectedTag(null); setActiveView('notes'); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-smooth
                  ${selectedFolder === folder ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                <Folder className={`w-3.5 h-3.5 ${selectedFolder === folder ? '' : 'folder-icon'}`} />
                <span className="truncate">{folder}</span>
              </button>
            ))}
          </div>
          
          <div className="pt-5">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Tags</p>
              <button onClick={() => setIsCreateTagOpen(true)} className="p-0.5 rounded hover:bg-secondary"><Plus className="w-3 h-3 text-muted-foreground" /></button>
            </div>
            {allTags.map(tag => (
              <button key={tag.name} onClick={() => { setSelectedTag(tag.name); setSelectedFolder(null); setActiveView('notes'); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-smooth
                  ${selectedTag === tag.name ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-secondary hover:text-foreground'}`}>
                <span 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ 
                    backgroundColor: selectedTag === tag.name 
                      ? 'rgba(255,255,255,0.8)' 
                      : tag.color === 'rose' ? 'hsl(350, 65%, 55%)'
                      : tag.color === 'amber' ? 'hsl(38, 80%, 50%)'
                      : tag.color === 'emerald' ? 'hsl(160, 50%, 45%)'
                      : tag.color === 'sapphire' ? 'hsl(220, 80%, 55%)'
                      : tag.color === 'violet' ? 'hsl(270, 55%, 55%)'
                      : 'hsl(215, 25%, 55%)'
                  }}
                />
                <span className="truncate font-medium">{tag.name}</span>
              </button>
            ))}
          </div>
        </nav>
        
        {/* User Profile Area */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            {/* Avatar with user initial */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/10">
              <span className="text-sm font-semibold text-primary">
                {userProfile?.full_name?.[0]?.toUpperCase() || 
                 authUser?.user_metadata?.full_name?.[0]?.toUpperCase() || 
                 authUser?.email?.[0]?.toUpperCase() || 
                 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-foreground">
                {userProfile?.full_name || 
                 authUser?.user_metadata?.full_name || 
                 authUser?.email?.split('@')[0] || 
                 'User'}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/70 font-medium">
                  Beta
                </span>
              </div>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 rounded-lg hover:bg-secondary transition-smooth">
              <Settings className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* New Welcome Header */}
        <header className="px-6 py-5 border-b border-border bg-gradient-to-br from-card to-background">
          {/* Top Row: Greeting + Search + Quick Note */}
          <div className="flex items-start gap-4 mb-4">
            {/* Left: Greeting */}
            <div className="flex-shrink-0">
              <h1 className="text-xl font-semibold text-foreground">
                {getGreeting()}, {getUserFirstName()} 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {unresolvedTodosCount > 0 ? (
                  <span>
                    You have <button onClick={() => setActiveView('todos')} className="text-primary hover:underline font-medium">{unresolvedTodosCount} unresolved item{unresolvedTodosCount !== 1 ? 's' : ''}</button> to tackle
                  </span>
                ) : (
                  <span>All caught up! ✨ Time to capture new ideas</span>
                )}
              </p>
            </div>
            
            {/* Center: Search */}
            <div className="flex-1 flex justify-center pt-1">
              <div className="relative w-full max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes, tags, keywords..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true) }}
                  onFocus={() => setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  className="pl-11 h-10 bg-secondary/50 border-border rounded-xl text-sm w-full"
                />
                {showSearchResults && searchResults.length > 0 && (
                  <SearchResults results={searchResults} onSelect={setSelectedNote} onClose={() => { setSearchQuery(''); setShowSearchResults(false) }} />
                )}
              </div>
            </div>
            
            {/* Right: Quick Note Button */}
            <div className="flex-shrink-0 pt-1">
              <Button onClick={startRecording} disabled={isRecording || isProcessing} size="sm" className="gap-1.5 h-10 shadow-sm px-4">
                <Plus className="w-4 h-4" /> Quick Note
              </Button>
            </div>
          </div>
          
          {/* Focus Items Section - Collapsible */}
          {intents.length > 0 && (
            <div className="mt-2">
              <button 
                onClick={() => setFocusItemsExpanded(!focusItemsExpanded)}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Focus Items</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{intents.length}</span>
                <ChevronUp className={`w-3.5 h-3.5 transition-transform ${focusItemsExpanded ? '' : 'rotate-180'}`} />
              </button>
              
              {focusItemsExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 animate-fade-in">
                  {intents.slice(0, 3).map((intent, idx) => (
                    <div 
                      key={intent.id || idx}
                      className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/50 border border-amber-100/50 hover:border-amber-200 transition-colors cursor-pointer"
                      onClick={() => {
                        if (intent.note_id) {
                          const note = notes.find(n => n.id === intent.note_id)
                          if (note) setSelectedNote(note)
                        }
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">{intent.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </header>
        
        {/* Subheader with filters */}
        <div className="px-6 py-3 border-b border-border/50 bg-card/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-foreground">
              {selectedTag ? `#${selectedTag}` : selectedFolder || (activeView === 'todos' ? 'Action Items' : 'All Notes')}
            </h2>
            {(selectedFolder || selectedTag) && (
              <span className="text-xs text-muted-foreground">
                ({displayNotes.length} note{displayNotes.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
          
          {/* Filter Controls */}
          <div className="flex items-center gap-2">
            {activeView === 'notes' && viewType === 'notes' && (
              <>
                <div className="flex items-center bg-secondary/50 rounded-lg p-1">
                  <button onClick={() => setFilter('recent')} className={`px-2.5 py-1 text-xs rounded-md transition-smooth ${filter === 'recent' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Clock className="w-3 h-3 inline mr-1" />Recent
                  </button>
                  <button onClick={() => setFilter('starred')} className={`px-2.5 py-1 text-xs rounded-md transition-smooth ${filter === 'starred' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Star className="w-3 h-3 inline mr-1" />Starred
                  </button>
                </div>
                <div className="flex items-center bg-secondary/50 rounded-lg p-1">
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-smooth ${viewMode === 'grid' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-smooth ${viewMode === 'list' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 pb-32">
          <div className="max-w-5xl mx-auto">
            {/* View Mode Toggle - Top Left of Content Area */}
            {activeView === 'notes' && (
              <div className="mb-6 flex items-center justify-between">
                <ViewModeToggle mode={viewType} onChange={setViewType} />
              </div>
            )}
            
            {activeView === 'todos' ? (
              todos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96">
                  <CheckSquare className="w-12 h-12 text-primary/20 mb-3" />
                  <p className="text-sm text-muted-foreground">No action items</p>
                </div>
              ) : (
                <div className="max-w-xl mx-auto space-y-2">
                  {todos.map(todo => (
                    <div key={todo.id} className={`flex items-center gap-3 p-3 rounded-xl border border-border transition-smooth ${todo.completed ? 'bg-secondary/30' : 'bg-card'}`}>
                      <Checkbox checked={todo.completed} onCheckedChange={() => toggleTodo(todo.id, todo.completed)} />
                      <span className={`text-sm ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>{todo.title}</span>
                    </div>
                  ))}
                </div>
              )
            ) : viewType === 'brain-dump' ? (
              /* Brain Dump View */
              <BrainDumpView 
                userId={userId}
                contextScope={
                  selectedFolder 
                    ? { type: 'folder', folder: selectedFolder }
                    : selectedTag 
                    ? { type: 'tag', tag: selectedTag }
                    : { type: 'global' }
                }
                onNoteClick={(noteId) => {
                  const note = notes.find(n => n.id === noteId)
                  if (note) setSelectedNote(note)
                }}
                noteCount={displayNotes.length}
              />
            ) : (
              /* Notes View */
              displayNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96">
                  <Mic className="w-12 h-12 text-primary/20 mb-3" />
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Click Quick Note to start recording</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayNotes.map(note => (
                    <NoteCard key={note.id} note={note} onClick={() => setSelectedNote(note)} onDelete={deleteNote} onStar={toggleStar} onAddTag={addTagToNote} onAddToFolder={addToFolder} onRemoveTag={removeTagFromNote} onRemoveFolder={removeFromFolder} allTags={allTags} folders={folders} />
                  ))}
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-2">
                  {displayNotes.map(note => (
                    <NoteRow key={note.id} note={note} onClick={() => setSelectedNote(note)} onDelete={deleteNote} onStar={toggleStar} allTags={allTags} />
                  ))}
                </div>
              )
            )}
          </div>
        </div>
        
        {/* Bottom Bar - Stable container to prevent flicker */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
          {/* Recording/Processing State - Always mounted, visibility controlled */}
          <div 
            className={`flex items-center gap-4 px-5 py-3 rounded-2xl bg-card border border-border shadow-xl transition-all duration-300 ease-out ${
              isRecording || isProcessing 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 translate-y-2 pointer-events-none absolute'
            }`}
            style={{ minWidth: isRecording || isProcessing ? '200px' : '0' }}
          >
            {isRecording ? (
              <>
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-sm font-medium tabular-nums min-w-[40px]">{formatDuration(recordingDuration)}</span>
                <Waveform />
                <button 
                  onClick={stopRecording} 
                  className="ml-2 p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-colors"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm">Processing...</span>
              </>
            ) : null}
          </div>
          
          {/* Default State - Mic + Chat */}
          <div 
            className={`flex items-center gap-3 transition-all duration-300 ease-out ${
              isRecording || isProcessing 
                ? 'opacity-0 scale-95 pointer-events-none absolute' 
                : 'opacity-100 scale-100'
            }`}
          >
            <button 
              onClick={startRecording} 
              className="p-3.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-all duration-200 hover:scale-105"
            >
              <Mic className="w-5 h-5" />
            </button>
            <GlobalChatBar 
              userId={userId} 
              isExpanded={isChatExpanded} 
              onToggle={() => setIsChatExpanded(!isChatExpanded)}
              contextScope={
                selectedFolder 
                  ? { type: 'folder', folder: selectedFolder, viewType }
                  : selectedTag 
                  ? { type: 'tag', tag: selectedTag, viewType }
                  : { type: 'global', viewType }
              }
              noteCount={displayNotes.length}
            />
          </div>
        </div>
      </main>
      
      <SettingsModal 
        open={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        user={authUser}
        profile={userProfile}
        onLogout={handleLogout}
        onClearData={handleClearAllData}
        onDeleteAccount={handleDeleteAccount}
      />
      <CreateTagModal open={isCreateTagOpen} onClose={() => setIsCreateTagOpen(false)} onCreate={createTag} />
      <CreateFolderModal open={isCreateFolderOpen} onClose={() => setIsCreateFolderOpen(false)} onCreate={createFolder} />
    </div>
  )
}
