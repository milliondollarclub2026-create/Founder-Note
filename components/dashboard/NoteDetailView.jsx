'use client'

import { useState, useEffect } from 'react'
import {
  ArrowLeft, Search, Copy, Check, Sparkles, FileText, Tag, Folder, X,
  Edit3, Save, Loader2, RefreshCw, Square, Mic
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

import { SearchResults } from './SearchResults'
import { Waveform } from './Waveform'
import { ContextAwareChatBar } from './ChatPanel'
import { getTagStyle } from '@/lib/tag-colors'

// Formatted Smartified Text Component
const SmartifiedTextDisplay = ({ text, isEditing, onTextChange }) => {
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

  if (isEditing) {
    return (
      <div className="relative">
        <div className="absolute top-3 left-4 flex items-center gap-1.5 pointer-events-none">
          <Edit3 className="w-3 h-3 text-primary/30" />
          <span className="text-[10px] text-primary/30 font-medium uppercase tracking-wider">Editing</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          className="w-full min-h-[300px] pt-9 px-4 pb-4 rounded-xl bg-card border-2 border-primary/15 text-base leading-relaxed resize-none focus:outline-none focus:border-primary/30 transition-colors selection:bg-primary/10"
          placeholder="Edit your smartified text..."
          style={{ fontFamily: 'inherit' }}
        />
      </div>
    )
  }

  return (
    <div className="prose prose-sm max-w-none">
      {renderFormattedText(text)}
    </div>
  )
}

// Note Detail View - Full width immersive experience
export const NoteDetailView = ({
  note,
  onClose,
  onDelete,
  onAddTag,
  onRemoveTag,
  onAddToFolder,
  onUpdateNote,
  allTags,
  folders,
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
  onSelectSearchResult,
  onIntentCaptured
}) => {
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
  const [showCopied, setShowCopied] = useState(false)

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

  // Save transcript changes and auto-regenerate AI content
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

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || `Save failed (${response.status})`)
      }

      // Update parent state with server response
      if (onUpdateNote && data.note) {
        onUpdateNote(data.note)
      }

      setHasUnsavedChanges(false)
      setIsEditing(false)
      toast.success('Saved — updating AI insights...')

      // Auto-regenerate AI content after saving
      regenerateAIContent()
    } catch (error) {
      toast.error(error.message || 'Failed to save changes')
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
          transcription: contentToAnalyze
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
    setShowCopied(true)
    setTimeout(() => setShowCopied(false), 1500)
    toast.success('Copied to clipboard')
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  const formatDuration = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

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
          {showCopied ? (
            <Check className="w-4 h-4 text-primary animate-scale-in" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </header>

      {/* Main Content - Full Width */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8">
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
            <div className={`p-6 rounded-xl bg-gradient-to-br from-primary/5 to-accent/10 border border-primary/10 border-l-[3px] border-l-primary/30 ring-1 ring-primary/5 mb-8 relative transition-all duration-500 ${isRegenerating ? 'scale-[0.99]' : ''}`}>
              {isRegenerating && (
                <div className="absolute inset-0 bg-card/50 backdrop-blur-[2px] rounded-xl flex items-center justify-center z-10 animate-fade-in">
                  <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-card/95 border border-primary/10 shadow-md animate-fade-in">
                    <Sparkles className="w-3.5 h-3.5 text-primary animate-breathe" />
                    <span className="text-xs font-medium text-primary/70">Updating summary</span>
                    <div className="flex gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0s', animationDuration: '1s' }} />
                      <span className="w-1 h-1 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0.15s', animationDuration: '1s' }} />
                      <span className="w-1 h-1 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '1s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 mb-3 group/summary">
                <Sparkles className="w-5 h-5 text-primary transition-transform duration-300 group-hover/summary:rotate-12" />
                <span className="text-sm font-semibold text-primary">AI Summary</span>
              </div>
              <p className="text-base text-foreground/90 leading-relaxed">{note.summary}</p>
            </div>
          )}

          {/* Fixed Content: Key Points - NOT EDITABLE */}
          {note.key_points?.length > 0 && (
            <div className={`mb-8 relative transition-all duration-500 ${isRegenerating ? 'scale-[0.99]' : ''}`}>
              {isRegenerating && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] rounded-xl flex items-center justify-center z-10 animate-fade-in">
                  <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-card/95 border border-primary/10 shadow-md animate-fade-in">
                    <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" style={{ animationDuration: '1.5s' }} />
                    <span className="text-xs font-medium text-primary/70">Updating key points</span>
                  </div>
                </div>
              )}
              <h3 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wide">Key Points</h3>
              <ul className="space-y-3">
                {note.key_points.map((point, i) => (
                  <li
                    key={i}
                    onClick={() => { navigator.clipboard.writeText(point); toast.success('Key point copied') }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors duration-150 group/kp"
                    title="Click to copy"
                  >
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/kp:bg-primary group-hover/kp:text-primary-foreground transition-colors">{i + 1}</span>
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
                  <div className="flex items-center gap-2 mr-4 animate-fade-in">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelEditing}
                      className="h-8 px-3 text-xs text-muted-foreground"
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
                      Save &amp; Update
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
                <div className="relative flex items-center bg-secondary/50 rounded-lg p-1">
                  <div
                    className="absolute top-1 bottom-1 bg-card shadow-sm rounded-md transition-all duration-200 ease-out"
                    style={{
                      left: textMode === 'smart' ? '4px' : '50%',
                      width: 'calc(50% - 4px)',
                    }}
                  />
                  <button
                    onClick={() => setTextMode('smart')}
                    className={`relative z-10 flex items-center justify-center gap-1.5 w-24 py-1.5 text-xs rounded-md transition-colors duration-200 font-medium whitespace-nowrap ${textMode === 'smart' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Sparkles className="w-3 h-3 flex-shrink-0" />Smartified
                  </button>
                  <button
                    onClick={() => setTextMode('raw')}
                    className={`relative z-10 flex items-center justify-center gap-1.5 w-24 py-1.5 text-xs rounded-md transition-colors duration-200 font-medium whitespace-nowrap ${textMode === 'raw' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <FileText className="w-3 h-3 flex-shrink-0" />Raw
                  </button>
                </div>
              </div>
            </div>

            {/* Unsaved changes indicator */}
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 mb-3 text-primary/70 text-xs animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse" />
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
              <div className={`p-6 rounded-xl ${isEditing ? 'bg-card border-2 border-primary/15' : 'bg-muted/30 border border-border'} transition-colors`}>
                {isEditing ? (
                  <div className="relative">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Edit3 className="w-3 h-3 text-primary/30" />
                      <span className="text-[10px] text-primary/30 font-medium uppercase tracking-wider">Editing</span>
                    </div>
                    <textarea
                      value={editedRawText}
                      onChange={(e) => handleTextChange(e.target.value)}
                      className="w-full min-h-[300px] p-0 bg-transparent text-base leading-relaxed resize-none focus:outline-none selection:bg-primary/10"
                      placeholder="Edit your transcription..."
                      style={{ fontFamily: 'inherit' }}
                    />
                  </div>
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

          {/* Chat Bar - Note-scoped, uses shared component for consistency */}
          <div className="pointer-events-auto">
            <ContextAwareChatBar
              contextScope={{ type: 'note', noteId: note.id, noteTitle: note.title }}
              isExpanded={isChatExpanded}
              onToggle={() => setIsChatExpanded(!isChatExpanded)}
              noteCount={1}
              onSelectNote={(source) => onSelectSearchResult?.(source)}
              onIntentCaptured={onIntentCaptured}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
