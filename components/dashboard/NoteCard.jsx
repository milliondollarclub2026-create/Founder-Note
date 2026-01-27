'use client'

import { useState, useRef } from 'react'
import { Star, Tag, Trash2, Folder, Check } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { TagBadge } from './TagBadge'
import { getTagColor } from '@/lib/tag-colors'

// Note Card (Grid View)
export const NoteCard = ({ note, onClick, onDelete, onStar, onAddTag, onAddToFolder, allTags, folders }) => {
  const [showActions, setShowActions] = useState(false)
  const [starBounce, setStarBounce] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteTimeout = useRef(null)

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
      onMouseLeave={() => { setShowActions(false); setConfirmDelete(false); clearTimeout(deleteTimeout.current) }}
      className="group relative p-4 rounded-xl border border-border bg-card cursor-pointer hover-lift-glow transition-all duration-200"
    >
      {/* Hover Actions */}
      <div className={`absolute top-3 right-3 flex items-center gap-0.5 bg-card/95 backdrop-blur-sm rounded-lg px-1 py-0.5 shadow-sm border border-border/50 transition-all duration-200 ${showActions ? 'opacity-100 translate-y-0 delay-100' : 'opacity-0 -translate-y-1 pointer-events-none'}`}>
        <button onClick={(e) => { e.stopPropagation(); setStarBounce(true); setTimeout(() => setStarBounce(false), 300); onStar(note.id, !note.starred); }} className="p-1.5 rounded-md hover:bg-secondary transition-smooth">
          <Star className={`w-3.5 h-3.5 transition-transform ${starBounce ? 'animate-star-bounce' : ''} ${note.starred ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
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
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirmDelete) {
              onDelete(note.id)
              setConfirmDelete(false)
            } else {
              setConfirmDelete(true)
              deleteTimeout.current = setTimeout(() => setConfirmDelete(false), 2000)
            }
          }}
          className={`p-1.5 rounded-md transition-smooth ${confirmDelete ? 'bg-destructive/15' : 'hover:bg-destructive/10'}`}
          title={confirmDelete ? 'Click again to delete' : 'Delete note'}
        >
          <Trash2 className={`w-3.5 h-3.5 ${confirmDelete ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`} />
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

// Note Row (List View)
export const NoteRow = ({ note, onClick, onDelete, onStar, allTags }) => {
  const [showActions, setShowActions] = useState(false)
  const [starBounce, setStarBounce] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteTimeout = useRef(null)

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
    return { name: tagName, color: tagConfig?.color || 'slate' }
  })

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setConfirmDelete(false); clearTimeout(deleteTimeout.current) }}
      className={`group flex items-center gap-4 px-4 py-3 rounded-xl border bg-card cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 ${note.starred ? 'border-l-2 border-l-primary border-border' : 'border-border'}`}
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
      <div className={`flex items-center gap-0.5 transition-all duration-200 ${showActions ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none'}`}>
        <button onClick={(e) => { e.stopPropagation(); setStarBounce(true); setTimeout(() => setStarBounce(false), 300); onStar(note.id, !note.starred); }} className="p-1.5 rounded-lg hover:bg-secondary transition-smooth">
          <Star className={`w-3.5 h-3.5 transition-transform ${starBounce ? 'animate-star-bounce' : ''} ${note.starred ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirmDelete) {
              onDelete(note.id)
              setConfirmDelete(false)
            } else {
              setConfirmDelete(true)
              deleteTimeout.current = setTimeout(() => setConfirmDelete(false), 2000)
            }
          }}
          className={`p-1.5 rounded-lg transition-smooth ${confirmDelete ? 'bg-destructive/15' : 'hover:bg-destructive/10'}`}
          title={confirmDelete ? 'Click again to delete' : 'Delete note'}
        >
          <Trash2 className={`w-3.5 h-3.5 ${confirmDelete ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`} />
        </button>
      </div>
    </div>
  )
}
