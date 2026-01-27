'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  Mic, Search, Star, Plus, Settings, CheckSquare, Home, FileText,
  Loader2, Folder, LayoutGrid, List, Clock, ChevronUp, Square, Lightbulb, Menu, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
// Dashboard components
import { Waveform } from '@/components/dashboard/Waveform'
import { NavItem } from '@/components/dashboard/NavItem'
import { SearchResults } from '@/components/dashboard/SearchResults'
import { NoteCard, NoteRow } from '@/components/dashboard/NoteCard'
import { NoteDetailView } from '@/components/dashboard/NoteDetailView'
import { BrainDumpView } from '@/components/dashboard/BrainDumpView'
import { ViewModeToggle } from '@/components/dashboard/ViewModeToggle'
import { SettingsModal } from '@/components/dashboard/SettingsModal'
import { CreateTagModal } from '@/components/dashboard/CreateTagModal'
import { CreateFolderModal } from '@/components/dashboard/CreateFolderModal'
import { GlobalChatBar } from '@/components/dashboard/ChatPanel'

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

export default function Dashboard() {
  const router = useRouter()
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authUser, setAuthUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)

  const [activeView, setActiveView] = useState('notes')
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [selectedTag, setSelectedTag] = useState(null)
  const [filter, setFilter] = useState('recent')
  const [viewMode, setViewMode] = useState('grid')
  const [viewType, setViewType] = useState('notes') // 'notes' or 'brain-dump'

  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0) // 0=transcribing, 1=extracting, 2=smartifying, 3=saving

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
    if (!isAuthLoading && authUser) {
      fetchNotes()
      fetchTodos()
    }
  }, [isAuthLoading, authUser])

  // State for focus items section
  const [focusItemsExpanded, setFocusItemsExpanded] = useState(true)
  const [intents, setIntents] = useState([])

  // Fetch intents (focus items) after auth
  useEffect(() => {
    const fetchIntents = async () => {
      try {
        const response = await fetch(`/api/intents?limit=5`)
        if (response.ok) {
          const data = await response.json()
          setIntents(data.intents || [])
        }
      } catch (error) {
        console.error('Failed to fetch intents:', error)
      }
    }
    if (!isAuthLoading && authUser) {
      fetchIntents()
    }
  }, [isAuthLoading, authUser])

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
    try {
      const response = await fetch('/api/user/clear-all-data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
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
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
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
      const response = await fetch('/api/notes')
      const data = await response.json()
      setNotes(data.notes || [])
    } catch (error) { console.error('Error fetching notes:', error) }
  }

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos')
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
    setProcessingStep(0)
    try {
      // Step 1: Transcribe with Deepgram
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      const transcribeRes = await fetch('/api/transcribe', { method: 'POST', body: formData })
      if (!transcribeRes.ok) throw new Error('Transcription failed')
      const transcribeData = await transcribeRes.json()
      if (!transcribeData.transcription) throw new Error('No speech detected')

      setProcessingStep(1)

      // Step 2: Extract insights (title, summary, key points, action items)
      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: transcribeData.transcription })
      })
      if (!extractRes.ok) throw new Error('Extraction failed')
      const extractData = await extractRes.json()

      setProcessingStep(2)

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

      setProcessingStep(3)
      // Step 4: Save note with all data including smartified text
      const saveRes = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

  // Cmd+K / Ctrl+K keyboard shortcut to focus search
  const searchInputRef = useRef(null)
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Show loading state while checking auth — full skeleton layout
  if (isAuthLoading) {
    return (
      <div className="flex h-screen bg-background">
        {/* Sidebar skeleton */}
        <aside className="w-56 border-r border-border bg-sidebar flex flex-col p-4">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg animate-shimmer" />
            <div className="h-4 w-24 rounded animate-shimmer" />
          </div>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 rounded-lg animate-shimmer" />
            ))}
          </div>
          <div className="mt-auto">
            <div className="h-10 rounded-lg animate-shimmer" />
          </div>
        </aside>
        {/* Main content skeleton */}
        <main className="flex-1 flex flex-col">
          <header className="px-6 py-5 border-b border-border">
            <div className="flex items-start gap-4">
              <div className="space-y-2">
                <div className="h-6 w-48 rounded animate-shimmer" />
                <div className="h-4 w-32 rounded animate-shimmer" />
              </div>
              <div className="flex-1 flex justify-center pt-1">
                <div className="h-10 w-full max-w-xl rounded-xl animate-shimmer" />
              </div>
              <div className="h-10 w-28 rounded-lg animate-shimmer" />
            </div>
          </header>
          <div className="px-6 py-3 border-b border-border/50">
            <div className="h-6 w-24 rounded animate-shimmer" />
          </div>
          <div className="flex-1 p-6">
            <div className="mb-6">
              <div className="h-8 w-40 rounded-xl animate-shimmer" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-44 rounded-xl animate-shimmer" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (selectedNote) {
    return <div className="animate-slide-in-right"><NoteDetailView
      note={selectedNote}
      onClose={() => setSelectedNote(null)}
      onDelete={deleteNote}
      onAddTag={addTagToNote}
      onRemoveTag={removeTagFromNote}
      onAddToFolder={addToFolder}
      onUpdateNote={handleUpdateNote}
      allTags={allTags}
      folders={folders}
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
    /></div>
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden animate-fade-in" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-56 border-r border-border bg-sidebar flex flex-col transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-4 py-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Founder Note</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <NavItem icon={Home} label="All Notes" active={activeView === 'notes' && !selectedTag && !selectedFolder} onClick={() => { setActiveView('notes'); setSelectedTag(null); setSelectedFolder(null); setIsSidebarOpen(false) }} count={notes.length} />
          <NavItem icon={CheckSquare} label="Action Items" active={activeView === 'todos'} onClick={() => { setActiveView('todos'); setIsSidebarOpen(false) }} count={pendingTodos.length} />

          <div className="pt-5">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Folders</p>
              <button onClick={() => setIsCreateFolderOpen(true)} className="p-0.5 rounded hover:bg-secondary"><Plus className="w-3 h-3 text-muted-foreground" /></button>
            </div>
            {folders.map(folder => (
              <button key={folder} onClick={() => { setSelectedFolder(folder); setSelectedTag(null); setActiveView('notes'); setIsSidebarOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-all duration-150
                  ${selectedFolder === folder ? 'bg-primary/10 text-primary border-l-2 border-primary font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                <Folder className={`w-3.5 h-3.5 ${selectedFolder === folder ? 'text-primary' : 'folder-icon'}`} />
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
              <button key={tag.name} onClick={() => { setSelectedTag(tag.name); setSelectedFolder(null); setActiveView('notes'); setIsSidebarOpen(false) }}
                className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150
                  ${selectedTag === tag.name ? 'bg-primary/10 text-primary border-l-2 border-primary font-medium' : 'text-foreground/70 hover:bg-secondary hover:text-foreground'}`}>
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-150 group-hover:scale-110"
                  style={{
                    backgroundColor: selectedTag === tag.name
                      ? 'hsl(355, 48%, 39%)'
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
            {/* Mobile menu toggle */}
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg hover:bg-secondary lg:hidden flex-shrink-0 -ml-2">
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
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
                  ref={searchInputRef}
                  placeholder="Search notes, tags, keywords..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true) }}
                  onFocus={() => { setShowSearchResults(true); setSearchFocused(true) }}
                  onBlur={() => { setTimeout(() => setShowSearchResults(false), 200); setSearchFocused(false) }}
                  className="pl-11 pr-16 h-10 bg-secondary/50 border-border rounded-xl text-sm w-full"
                />
                {!searchFocused && !searchQuery && (
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] text-muted-foreground font-mono">
                    ⌘K
                  </kbd>
                )}
                {showSearchResults && (
                  <SearchResults results={searchResults} query={searchQuery} onSelect={setSelectedNote} onClose={() => { setSearchQuery(''); setShowSearchResults(false) }} />
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
                <div className="flex flex-col items-center justify-center h-96 animate-fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
                    <CheckSquare className="w-8 h-8 text-primary/30" />
                  </div>
                  <p className="text-sm font-medium text-foreground/80 mb-1">All caught up!</p>
                  <p className="text-xs text-muted-foreground">Action items from your notes will appear here</p>
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
                <div className="flex flex-col items-center justify-center h-96 animate-fade-in">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-5">
                    <Mic className="w-9 h-9 text-primary/40" />
                  </div>
                  <p className="text-base font-medium text-foreground/80 mb-1.5">
                    {selectedFolder ? `No notes in ${selectedFolder}` : selectedTag ? `No notes tagged #${selectedTag}` : 'Your notes will live here'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-5">Tap the mic or press Quick Note to capture your first thought</p>
                  <Button onClick={startRecording} disabled={isRecording || isProcessing} size="sm" className="gap-1.5 shadow-sm">
                    <Mic className="w-3.5 h-3.5" /> Record your first note
                  </Button>
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
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3 z-50 w-[calc(100%-2rem)] md:w-auto justify-center">
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
                <span className="text-sm font-medium">
                  {['Transcribing...', 'Extracting insights...', 'Smartifying...', 'Saving...'][processingStep]}
                </span>
                <div className="flex items-center gap-1 ml-1">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${i <= processingStep ? 'bg-primary' : 'bg-border'}`} />
                  ))}
                </div>
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
              className="p-4 md:p-3.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 animate-pulse-glow flex-shrink-0"
            >
              <Mic className="w-5 h-5" />
            </button>
            <GlobalChatBar
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
