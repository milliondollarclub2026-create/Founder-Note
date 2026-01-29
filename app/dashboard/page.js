'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  Mic, Search, Star, Plus, Settings, CircleCheckBig, Home, FileText,
  Loader2, Folder, LayoutGrid, List, Clock, ChevronUp, Square, Menu, X,
  MoreHorizontal, Edit3, Trash2, Lightbulb, LogOut, HelpCircle, ChevronsUpDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
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
import { CompletedView } from '@/components/dashboard/CompletedView'
import { DashboardOnboarding } from '@/components/dashboard/DashboardOnboarding'

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

const getStoredStarredFolders = () => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('foundernote_starred_folders')
  return stored ? JSON.parse(stored) : []
}

const saveStoredStarredFolders = (starred) => {
  if (typeof window !== 'undefined') localStorage.setItem('foundernote_starred_folders', JSON.stringify(starred))
}

export default function Dashboard() {
  const router = useRouter()
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authUser, setAuthUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)

  const [selectedFolder, setSelectedFolder] = useState(null)
  const [selectedTag, setSelectedTag] = useState(null)
  const [filter, setFilter] = useState('recent')
  const [viewMode, setViewMode] = useState('list')
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
  const [starredFolders, setStarredFolders] = useState(getStoredStarredFolders)
  const [renamingItem, setRenamingItem] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [activeView, setActiveView] = useState(null) // null | 'completed'
  const [completedIntents, setCompletedIntents] = useState([])
  const [usage, setUsage] = useState(null)

  // Brain dump client-side cache: Map<scopeKey, { synthesis, cachedAt }>
  const brainDumpCacheRef = useRef({})
  const [brainDumpStale, setBrainDumpStale] = useState(true)

  const handleSynthesisLoaded = useCallback((result) => {
    brainDumpCacheRef.current[result.scopeKey] = {
      synthesis: result.synthesis,
      cachedAt: result.cachedAt || new Date().toISOString()
    }
    setBrainDumpStale(false)
  }, [])

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
        .maybeSingle()

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

  // Hydrate tags/folders from localStorage after mount (SSR returns defaults)
  useEffect(() => {
    const storedTags = localStorage.getItem('foundernote_tags')
    if (storedTags !== null) setAllTags(JSON.parse(storedTags))

    const storedFolders = localStorage.getItem('foundernote_folders')
    if (storedFolders !== null) setFolders(JSON.parse(storedFolders))

    const storedStarred = localStorage.getItem('foundernote_starred_folders')
    if (storedStarred !== null) setStarredFolders(JSON.parse(storedStarred))
  }, [])

  // Fetch data after auth is confirmed
  useEffect(() => {
    if (!isAuthLoading && authUser) {
      fetchNotes()
      fetchTodos()
      fetchUsage()
    }
  }, [isAuthLoading, authUser])

  // Show usage warning toasts
  useEffect(() => {
    if (!usage) return
    if (usage.warnings.notesMax) {
      toast.warning('You\'ve reached the 10 note limit on your beta plan.')
    } else if (usage.warnings.notes90) {
      toast.warning('You\'ve used 9 of 10 notes on your beta plan.')
    } else if (usage.warnings.notes80) {
      toast('You\'ve used 8 of 10 notes on your beta plan.', { icon: '📝' })
    }
    if (usage.warnings.transMax) {
      toast.warning('You\'ve reached the 100 minute transcription limit on your beta plan.')
    } else if (usage.warnings.trans90) {
      toast.warning('You\'re at 90% of your 100 minute transcription limit.')
    } else if (usage.warnings.trans80) {
      toast('You\'re at 80% of your 100 minute transcription limit.', { icon: '🎙️' })
    }
  }, [usage?.notes?.used, usage?.transcription?.usedSeconds])

  // State for next steps section (merged todos + intents)
  const [nextStepsExpanded, setNextStepsExpanded] = useState(true)
  const [intents, setIntents] = useState([])

  // Auto-collapse Actions when navigating to folder/tag, expand on All Notes
  useEffect(() => {
    if (selectedFolder || selectedTag) {
      setNextStepsExpanded(false)
    } else {
      setNextStepsExpanded(true)
    }
  }, [selectedFolder, selectedTag])

  // Fetch intents (next steps / focus items)
  const fetchIntents = async () => {
    try {
      const response = await fetch(`/api/intents?limit=50`)
      if (response.ok) {
        const data = await response.json()
        setIntents(data.intents || [])
      } else {
        console.error('Intents fetch failed:', response.status, await response.text().catch(() => ''))
      }
    } catch (error) {
      console.error('Failed to fetch intents:', error)
    }
  }

  // Fetch completed/archived intents
  const fetchCompletedIntents = async () => {
    try {
      const response = await fetch('/api/intents?status=completed&limit=50')
      if (response.ok) {
        const data = await response.json()
        setCompletedIntents(data.intents || [])
      }
    } catch (error) {
      console.error('Failed to fetch completed intents:', error)
    }
  }

  useEffect(() => {
    if (!isAuthLoading && authUser) {
      fetchIntents()
      fetchCompletedIntents()
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

  // Merge pending todos + active intents into unified "Actions" list
  const nextStepsItems = useMemo(() => {
    const todoItems = todos
      .filter(t => !t.completed)
      .map(t => ({
        type: 'todo',
        id: t.id,
        text: t.title,
        sourceNoteId: t.note_id,
        sourceTitle: t.notes?.title || null,
        completed: t.completed,
        createdAt: t.created_at
      }))
    const intentItems = intents
      .filter(i => i.normalized_intent || i.raw_text)
      .map(i => ({
        type: 'intent',
        id: i.id,
        text: i.normalized_intent || i.raw_text,
        sourceNoteId: i.source_id,
        sourceTitle: i.source_title || null,
        intentType: i.intent_type,
        createdAt: i.created_at
      }))
    return [...todoItems, ...intentItems].slice(0, 20)
  }, [todos, intents])

  // Build unique source map for inline numbered references in Actions
  // Numbered by note creation order (oldest = 1, next = 2, etc.)
  const nextStepsSources = useMemo(() => {
    const sourceMap = new Map()
    // Collect all unique source notes
    const uniqueSources = []
    nextStepsItems.forEach(item => {
      if (item.sourceNoteId && !uniqueSources.find(s => s.id === item.sourceNoteId)) {
        const note = notes.find(n => n.id === item.sourceNoteId)
        uniqueSources.push({
          id: item.sourceNoteId,
          title: item.sourceTitle,
          summary: note?.summary || '',
          date: note?.created_at || ''
        })
      }
    })
    // Sort by creation date ascending (oldest first = #1)
    uniqueSources.sort((a, b) => new Date(a.date) - new Date(b.date))
    uniqueSources.forEach((src, idx) => {
      sourceMap.set(src.id, { ...src, index: idx + 1 })
    })
    return sourceMap
  }, [nextStepsItems, notes])

  // Completed items for the Completed view
  const completedTodos = useMemo(() => todos.filter(t => t.completed), [todos])
  const hasCompletedItems = completedTodos.length > 0 || completedIntents.length > 0

  // Redirect away from completed view if no items left
  useEffect(() => {
    if (activeView === 'completed' && !hasCompletedItems) {
      setActiveView(null)
    }
  }, [activeView, hasCompletedItems])

  // Toggle intent status (active <-> completed) with optimistic update
  const toggleIntentStatus = async (intentId, newStatus) => {
    if (newStatus === 'active') {
      // Moving from completed → active
      const intent = completedIntents.find(i => i.id === intentId)
      if (intent) {
        setCompletedIntents(prev => prev.filter(i => i.id !== intentId))
        setIntents(prev => [{ ...intent, status: 'active', completed_at: null }, ...prev])
      }
      try {
        const res = await fetch(`/api/intents/${intentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active' })
        })
        if (!res.ok) throw new Error('Failed')
      } catch (error) {
        // Revert
        if (intent) {
          setIntents(prev => prev.filter(i => i.id !== intentId))
          setCompletedIntents(prev => [intent, ...prev])
        }
        toast.error('Failed to restore')
      }
    } else {
      // Moving from active → completed
      const intent = intents.find(i => i.id === intentId)
      if (intent) {
        setIntents(prev => prev.filter(i => i.id !== intentId))
        setCompletedIntents(prev => [{ ...intent, status: newStatus, completed_at: new Date().toISOString() }, ...prev])
      }
      try {
        const res = await fetch(`/api/intents/${intentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        })
        if (!res.ok) throw new Error('Failed')
      } catch (error) {
        if (intent) {
          setCompletedIntents(prev => prev.filter(i => i.id !== intentId))
          setIntents(prev => [intent, ...prev])
        }
        toast.error('Failed to archive')
      }
    }
  }

  // Group notes by date
  const groupNotesByDate = (notesList) => {
    const groups = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const buckets = { today: [], yesterday: [], thisWeek: [], earlier: [] }
    notesList.forEach(note => {
      const d = new Date(note.created_at)
      d.setHours(0, 0, 0, 0)
      if (d >= today) buckets.today.push(note)
      else if (d >= yesterday) buckets.yesterday.push(note)
      else if (d >= weekAgo) buckets.thisWeek.push(note)
      else buckets.earlier.push(note)
    })

    if (buckets.today.length) groups.push({ label: 'Today', notes: buckets.today })
    if (buckets.yesterday.length) groups.push({ label: 'Yesterday', notes: buckets.yesterday })
    if (buckets.thisWeek.length) groups.push({ label: 'This Week', notes: buckets.thisWeek })
    if (buckets.earlier.length) groups.push({ label: 'Earlier', notes: buckets.earlier })
    return groups
  }

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
      setIntents([])
      setSelectedNote(null)
      setSelectedFolder(null)
      setSelectedTag(null)
      brainDumpCacheRef.current = {}
      setBrainDumpStale(true)

      toast.success('All data cleared successfully')
    } catch (error) {
      console.error('Clear data error:', error)
      toast.error(error.message || 'Failed to clear data')
      throw error
    }
  }

  // Cancel Subscription handler
  const handleCancelSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      // Sign out and redirect — don't await signOut to avoid hanging
      toast.success('Subscription cancelled. You can resubscribe anytime.')
      const supabase = createClient()
      supabase.auth.signOut().catch(() => {})
      router.push('/auth')
    } catch (error) {
      console.error('Cancel subscription error:', error)
      toast.error(error.message || 'Failed to cancel subscription')
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

  // Complete dashboard onboarding
  const handleCompleteOnboarding = async () => {
    try {
      const supabase = createClient()
      await supabase
        .from('user_profiles')
        .update({ dashboard_onboarding_completed: true })
        .eq('user_id', authUser.id)

      // Update local state
      setUserProfile(prev => ({ ...prev, dashboard_onboarding_completed: true }))
    } catch (error) {
      console.error('Failed to mark onboarding complete:', error)
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

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage')
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) { console.error('Error fetching usage:', error) }
  }

  const getOptimalMimeType = () => {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/wav']
    for (const type of types) { if (MediaRecorder.isTypeSupported(type)) return type }
    return 'audio/webm'
  }

  const startRecording = async () => {
    // Check note limit before recording
    if (usage?.warnings?.notesMax) {
      toast.error('Note limit reached. Your beta plan allows 10 notes.')
      return
    }
    if (usage?.warnings?.transMax) {
      toast.error('Transcription limit reached. Your beta plan allows 100 minutes.')
      return
    }
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
      if (!transcribeRes.ok) {
        const errData = await transcribeRes.json().catch(() => ({}))
        if (errData.code === 'TRANSCRIPTION_LIMIT') {
          toast.error(errData.error || 'Transcription limit reached')
          fetchUsage()
          return
        }
        throw new Error('Transcription failed')
      }
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
      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}))
        if (errData.code === 'NOTE_LIMIT') {
          toast.error(errData.error || 'Note limit reached')
          fetchUsage()
          return
        }
        throw new Error('Save failed')
      }
      const savedNote = await saveRes.json()
      // Silent success - auto-navigates to the note
      await Promise.all([fetchNotes(), fetchTodos(), fetchIntents(), fetchUsage()])
      setBrainDumpStale(true)

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
      // Silent - no toast for note deletion
      setSelectedNote(null)
      fetchNotes()
      fetchTodos()
      fetchUsage()
      setBrainDumpStale(true)
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

      // Silent - no toast for tag operations
      setBrainDumpStale(true)
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

      // Silent - no toast for tag operations
      setBrainDumpStale(true)
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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save folder')
      }

      // Update with server response to ensure consistency
      if (data.note) {
        setNotes(prev => prev.map(n => n.id !== noteId ? n : data.note))
        if (selectedNote?.id === noteId) setSelectedNote(data.note)
      }

      // Silent - no toast for folder operations
      setBrainDumpStale(true)
    } catch (error) {
      // Revert on error
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, folder: previousFolder } : n))
      if (selectedNote?.id === noteId) setSelectedNote(prev => ({ ...prev, folder: previousFolder }))
      toast.error(error.message || 'Failed to add to folder')
      console.error('Add to folder error:', error)
    }
  }

  // Update note in state (called from NoteDetailView after edits)
  const handleUpdateNote = (updatedNote) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n))
    setSelectedNote(updatedNote)
    setBrainDumpStale(true)
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

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to remove from folder')

      if (data.note) {
        setNotes(prev => prev.map(n => n.id !== noteId ? n : data.note))
        if (selectedNote?.id === noteId) setSelectedNote(data.note)
      }

      // Silent - no toast for folder operations
      setBrainDumpStale(true)
    } catch (error) {
      // Revert on error
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, folder: previousFolder } : n))
      if (selectedNote?.id === noteId) setSelectedNote(prev => ({ ...prev, folder: previousFolder }))
      toast.error(error.message || 'Failed to remove from folder')
    }
  }

  const createTag = (tag) => {
    if (!allTags.find(t => t.name === tag.name)) {
      const newTags = [...allTags, tag]; setAllTags(newTags); saveStoredTags(newTags)
      // Silent - no toast for tag operations
    }
  }

  const createFolder = (name) => {
    if (!folders.includes(name)) {
      const newFolders = [...folders, name]; setFolders(newFolders); saveStoredFolders(newFolders)
      // Silent - no toast for folder operations
    }
  }

  const toggleStarFolder = (folderName) => {
    setStarredFolders(prev => {
      const newStarred = prev.includes(folderName)
        ? prev.filter(f => f !== folderName)
        : [...prev, folderName]
      saveStoredStarredFolders(newStarred)
      return newStarred
    })
  }

  const startRenaming = (type, name) => {
    setRenamingItem({ type, name })
    setRenameValue(name)
  }

  const confirmRename = () => {
    if (!renamingItem || !renameValue.trim()) { setRenamingItem(null); return }

    if (renamingItem.type === 'folder') {
      const oldName = renamingItem.name
      const newName = renameValue.trim()
      if (oldName === newName || folders.includes(newName)) { setRenamingItem(null); return }

      const newFolders = folders.map(f => f === oldName ? newName : f)
      setFolders(newFolders)
      saveStoredFolders(newFolders)

      if (starredFolders.includes(oldName)) {
        const newStarred = starredFolders.map(f => f === oldName ? newName : f)
        setStarredFolders(newStarred)
        saveStoredStarredFolders(newStarred)
      }

      setNotes(prev => prev.map(n => n.folder === oldName ? { ...n, folder: newName } : n))
      if (selectedFolder === oldName) setSelectedFolder(newName)

      notes.filter(n => n.folder === oldName).forEach(n => {
        fetch(`/api/notes/${n.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder: newName })
        }).catch(console.error)
      })
      setBrainDumpStale(true)
    } else if (renamingItem.type === 'tag') {
      const oldName = renamingItem.name
      const newName = renameValue.trim()
      if (oldName === newName || allTags.find(t => t.name === newName)) { setRenamingItem(null); return }

      const newTags = allTags.map(t => t.name === oldName ? { ...t, name: newName } : t)
      setAllTags(newTags)
      saveStoredTags(newTags)

      setNotes(prev => prev.map(n => {
        if (n.tags?.includes(oldName)) {
          return { ...n, tags: n.tags.map(t => t === oldName ? newName : t) }
        }
        return n
      }))
      if (selectedTag === oldName) setSelectedTag(newName)

      notes.filter(n => n.tags?.includes(oldName)).forEach(n => {
        fetch(`/api/notes/${n.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: (n.tags || []).map(t => t === oldName ? newName : t) })
        }).catch(console.error)
      })
      setBrainDumpStale(true)
    }

    setRenamingItem(null)
  }

  const deleteFolder = (folderName) => {
    // Defer state changes so the dropdown portal can unmount cleanly
    setTimeout(async () => {
      const newFolders = folders.filter(f => f !== folderName)
      setFolders(newFolders)
      saveStoredFolders(newFolders)

      if (starredFolders.includes(folderName)) {
        const newStarred = starredFolders.filter(f => f !== folderName)
        setStarredFolders(newStarred)
        saveStoredStarredFolders(newStarred)
      }

      if (selectedFolder === folderName) setSelectedFolder(null)

      const affectedNotes = notes.filter(n => n.folder === folderName)
      setNotes(prev => prev.map(n => n.folder === folderName ? { ...n, folder: null } : n))

      for (const n of affectedNotes) {
        try {
          const res = await fetch(`/api/notes/${n.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder: null })
          })
          if (!res.ok) console.error('Failed to unassign note from folder:', await res.text())
        } catch (error) {
          console.error('Failed to unassign note from folder:', error)
        }
      }

      setBrainDumpStale(true)
      // Silent - no toast for folder operations
    }, 0)
  }

  const removeTagCompletely = (tagName) => {
    // Defer state changes so the dropdown portal can unmount cleanly
    setTimeout(async () => {
      if (selectedTag === tagName) setSelectedTag(null)

      // Capture affected notes BEFORE updating state
      const affectedNotes = notes.filter(n => n.tags?.includes(tagName))

      // Update local state
      const newTags = allTags.filter(t => t.name !== tagName)
      setAllTags(newTags)
      saveStoredTags(newTags)

      setNotes(prev => prev.map(n => {
        if (n.tags?.includes(tagName)) {
          return { ...n, tags: n.tags.filter(t => t !== tagName) }
        }
        return n
      }))

      // Sync each affected note with the backend
      for (const n of affectedNotes) {
        const updatedTags = (n.tags || []).filter(t => t !== tagName)
        try {
          const res = await fetch(`/api/notes/${n.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tags: updatedTags })
          })
          if (!res.ok) {
            console.error('Failed to remove tag from note:', await res.text())
          }
        } catch (error) {
          console.error('Failed to remove tag from note:', error)
        }
      }

      setBrainDumpStale(true)
      // Silent - no toast for tag operations
    }, 0)
  }

  const toggleTodo = async (todoId, completed) => {
    // Optimistic update
    setTodos(prev => prev.map(t => t.id === todoId ? { ...t, completed: !completed } : t))
    try {
      const res = await fetch(`/api/todos/${todoId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !completed }) })
      if (!res.ok) throw new Error('Failed')
    } catch (error) {
      // Revert on failure
      setTodos(prev => prev.map(t => t.id === todoId ? { ...t, completed } : t))
      toast.error('Failed to update')
    }
  }

  const formatDuration = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  // Sort folders: starred first, then alphabetical
  const sortedFolders = [...folders].sort((a, b) => {
    const aStarred = starredFolders.includes(a)
    const bStarred = starredFolders.includes(b)
    if (aStarred && !bStarred) return -1
    if (!aStarred && bStarred) return 1
    return 0
  })

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
      onIntentCaptured={fetchIntents}
      onTodosUpdated={fetchTodos}
    />
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden animate-fade-in" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside data-onboarding="sidebar" className={`fixed lg:static inset-y-0 left-0 z-50 w-56 border-r border-border bg-sidebar flex flex-col transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-4 py-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Founder Note</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <NavItem icon={Home} label="All Notes" active={!selectedTag && !selectedFolder && activeView === null} onClick={() => { setSelectedTag(null); setSelectedFolder(null); setActiveView(null); setIsSidebarOpen(false) }} count={notes.length} />

          <div className="pt-5">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Folders</p>
              <button onClick={() => setIsCreateFolderOpen(true)} className="p-0.5 rounded hover:bg-secondary"><Plus className="w-3 h-3 text-muted-foreground" /></button>
            </div>
            {sortedFolders.map(folder => (
              <div key={folder} className="group/folder relative">
                {renamingItem?.type === 'folder' && renamingItem.name === folder ? (
                  <div className="flex items-center gap-1 px-3 py-1.5">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenamingItem(null) }}
                      onBlur={confirmRename}
                      autoFocus
                      className="flex-1 text-[13px] px-1.5 py-0.5 rounded bg-secondary border border-border focus:outline-none focus:border-primary/30"
                    />
                  </div>
                ) : (
                  <button onClick={() => { setSelectedFolder(folder); setSelectedTag(null); setActiveView(null); setIsSidebarOpen(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-all duration-150 pr-8
                      ${selectedFolder === folder ? 'bg-primary/10 text-primary border-l-2 border-primary font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                    {starredFolders.includes(folder) && <Star className="w-3 h-3 fill-primary text-primary flex-shrink-0" />}
                    <Folder className={`w-3.5 h-3.5 flex-shrink-0 ${selectedFolder === folder ? 'text-primary' : 'folder-icon'}`} />
                    <span className="truncate">{folder}</span>
                  </button>
                )}
                {!(renamingItem?.type === 'folder' && renamingItem.name === folder) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover/folder:opacity-100 hover:bg-secondary/80 transition-all duration-150"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="w-40">
                      <DropdownMenuItem onClick={() => toggleStarFolder(folder)} className="gap-2 text-xs">
                        <Star className={`w-3.5 h-3.5 ${starredFolders.includes(folder) ? 'fill-primary text-primary' : ''}`} />
                        {starredFolders.includes(folder) ? 'Unstar' : 'Star folder'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => startRenaming('folder', folder)} className="gap-2 text-xs">
                        <Edit3 className="w-3.5 h-3.5" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteFolder(folder)} className="gap-2 text-xs text-destructive focus:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>

          <div className="pt-5">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Tags</p>
              <button onClick={() => setIsCreateTagOpen(true)} className="p-0.5 rounded hover:bg-secondary"><Plus className="w-3 h-3 text-muted-foreground" /></button>
            </div>
            {allTags.map(tag => (
              <div key={tag.name} className="group/tag relative">
                {renamingItem?.type === 'tag' && renamingItem.name === tag.name ? (
                  <div className="flex items-center gap-1 px-3 py-1.5">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenamingItem(null) }}
                      onBlur={confirmRename}
                      autoFocus
                      className="flex-1 text-[13px] px-1.5 py-0.5 rounded bg-secondary border border-border focus:outline-none focus:border-primary/30"
                    />
                  </div>
                ) : (
                  <button onClick={() => { setSelectedTag(tag.name); setSelectedFolder(null); setActiveView(null); setIsSidebarOpen(false) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 pr-8
                      ${selectedTag === tag.name ? 'bg-primary/10 text-primary border-l-2 border-primary font-medium' : 'text-foreground/70 hover:bg-secondary hover:text-foreground'}`}>
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-150"
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
                )}
                {!(renamingItem?.type === 'tag' && renamingItem.name === tag.name) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover/tag:opacity-100 hover:bg-secondary/80 transition-all duration-150"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="w-40">
                      <DropdownMenuItem onClick={() => startRenaming('tag', tag.name)} className="gap-2 text-xs">
                        <Edit3 className="w-3.5 h-3.5" />
                        Rename tag
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => removeTagCompletely(tag.name)} className="gap-2 text-xs text-destructive focus:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove tag
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>

          {hasCompletedItems && (
            <div className="pt-5">
              <NavItem
                icon={CircleCheckBig}
                label="Completed"
                active={activeView === 'completed'}
                onClick={() => { setActiveView('completed'); setSelectedFolder(null); setSelectedTag(null); setIsSidebarOpen(false) }}
                count={completedTodos.length + completedIntents.length}
              />
            </div>
          )}
        </nav>

        {/* User Profile Area */}
        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 px-2 py-1.5 w-full rounded-lg hover:bg-secondary/60 transition-smooth text-left">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/10 flex-shrink-0">
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
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/70 font-medium">
                      Beta
                    </span>
                  </div>
                </div>
                <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52 mb-1">
              {/* User info header */}
              <div className="px-2 py-2.5">
                <p className="text-sm font-medium truncate">
                  {userProfile?.full_name ||
                   authUser?.user_metadata?.full_name ||
                   'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {authUser?.email}
                </p>
                <span className="inline-flex items-center mt-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/70 font-medium">
                  Beta Plan
                </span>
                {usage && (
                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">Notes</span>
                        <span className="text-[10px] font-medium text-foreground">{usage.notes.used}/{usage.notes.limit}</span>
                      </div>
                      <div className="h-1 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(usage.notes.percent, 100)}%`,
                            backgroundColor: usage.notes.percent >= 90 ? 'hsl(0 84% 60%)' : usage.notes.percent >= 80 ? 'hsl(38 92% 50%)' : 'hsl(355 48% 39%)',
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">Transcription</span>
                        <span className="text-[10px] font-medium text-foreground">{usage.transcription.usedMinutes}/{usage.transcription.limitMinutes} min</span>
                      </div>
                      <div className="h-1 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(usage.transcription.percent, 100)}%`,
                            backgroundColor: usage.transcription.percent >= 90 ? 'hsl(0 84% 60%)' : usage.transcription.percent >= 80 ? 'hsl(38 92% 50%)' : 'hsl(355 48% 39%)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="gap-2 cursor-pointer">
                <Settings className="w-3.5 h-3.5" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer text-muted-foreground" onSelect={(e) => e.preventDefault()}>
                <HelpCircle className="w-3.5 h-3.5" />
                Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="w-3.5 h-3.5" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeView === 'completed' ? (
          <CompletedView
            completedTodos={completedTodos}
            completedIntents={completedIntents}
            onUncompleteTask={(todoId) => toggleTodo(todoId, true)}
            onUncompleteIntent={(intentId) => toggleIntentStatus(intentId, 'active')}
            onSelectNote={(noteId) => {
              const note = notes.find(n => n.id === noteId)
              if (note) { setSelectedNote(note); setActiveView(null) }
            }}
            notes={notes}
            onBack={() => setActiveView(null)}
          />
        ) : (
        <>
        {/* Welcome Header */}
        <header className="px-6 pt-6 pb-4 bg-gradient-to-br from-card to-background">
          {/* Top Row: Mobile menu + Search + Quick Note */}
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg hover:bg-secondary lg:hidden flex-shrink-0 -ml-2">
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex-1 relative">
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
            <Button onClick={startRecording} disabled={isRecording || isProcessing || usage?.warnings?.notesMax} size="sm" className="gap-1.5 h-10 shadow-sm px-4 flex-shrink-0" title={usage?.warnings?.notesMax ? 'Note limit reached' : undefined}>
              <Plus className="w-4 h-4" /> {usage?.warnings?.notesMax ? 'Limit reached' : 'Quick Note'}
            </Button>
          </div>

          {/* Greeting - Bold and inviting */}
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-[-0.02em]">
              {getGreeting()}, {getUserFirstName()}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {unresolvedTodosCount > 0 ? (
                <span>
                  You have <span className="text-primary font-medium">{unresolvedTodosCount} action{unresolvedTodosCount !== 1 ? 's' : ''}</span> ready for you
                </span>
              ) : (
                <span>You're all clear. What's on your mind?</span>
              )}
            </p>
          </div>

          {/* Toggle + Filters row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div data-onboarding="view-toggle">
                <ViewModeToggle mode={viewType} onChange={setViewType} />
              </div>
              {(selectedFolder || selectedTag) && (
                <span className="text-xs text-muted-foreground">
                  {selectedTag ? `#${selectedTag}` : selectedFolder} ({displayNotes.length})
                </span>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-2">
              {viewType === 'notes' && (
                <>
                  <div className="flex items-center bg-secondary/50 rounded-lg p-1">
                    <button onClick={() => setFilter('recent')} className={`flex items-center gap-1 whitespace-nowrap px-2.5 py-1 text-xs rounded-md transition-smooth ${filter === 'recent' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                      <Clock className="w-3 h-3 flex-shrink-0" />Recent
                    </button>
                    <button onClick={() => setFilter('starred')} className={`flex items-center gap-1 whitespace-nowrap px-2.5 py-1 text-xs rounded-md transition-smooth ${filter === 'starred' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                      <Star className="w-3 h-3 flex-shrink-0" />Starred
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

          {/* Actions — unified todos + intents (hidden in brain dump mode) */}
          {viewType === 'notes' && nextStepsItems.length > 0 && (
            <div data-onboarding="actions" className="mt-4 animate-fade-in relative z-10">
              <button
                onClick={() => setNextStepsExpanded(!nextStepsExpanded)}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <CircleCheckBig className="w-3.5 h-3.5 text-primary/50" />
                <span>Actions</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/70">
                  {nextStepsItems.length}
                </span>
                <ChevronUp className={`w-3.5 h-3.5 transition-transform ${nextStepsExpanded ? '' : 'rotate-180'}`} />
              </button>

              {nextStepsExpanded && (
                <div className="space-y-1 bg-card/50 border border-border/60 rounded-xl p-3 animate-fade-in">
                  {nextStepsItems.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/30 transition-all duration-200 group"
                    >
                      {item.type === 'todo' ? (
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => toggleTodo(item.id, item.completed)}
                          className="mt-0.5"
                        />
                      ) : (
                        <div className="relative mt-0.5 w-4 h-4 flex-shrink-0">
                          <Lightbulb className="w-4 h-4 text-primary/50 transition-opacity duration-150 group-hover:opacity-0" />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <Checkbox
                              checked={false}
                              onCheckedChange={() => toggleIntentStatus(item.id, 'completed')}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug">
                          {item.type === 'intent' && item.intentType && (
                            <span className="font-semibold capitalize">{item.intentType}: </span>
                          )}
                          {item.text}
                          {item.sourceNoteId && (() => {
                            const src = nextStepsSources.get(item.sourceNoteId)
                            return src ? (
                              <span className="relative inline-block ml-1.5 align-baseline translate-y-[-1px] group/src">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const note = notes.find(n => n.id === src.id)
                                    if (note) setSelectedNote(note)
                                  }}
                                  className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold bg-primary/10 text-primary hover:bg-primary/20 hover:scale-110 transition-all duration-150 cursor-pointer"
                                >
                                  {src.index}
                                </button>
                                {/* Hover tooltip */}
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-xl bg-card border border-border shadow-lg opacity-0 invisible group-hover/src:opacity-100 group-hover/src:visible transition-all duration-200 pointer-events-none z-50">
                                  <span className="block text-xs font-semibold text-foreground truncate">{src.title}</span>
                                  {src.date && (
                                    <span className="block text-[10px] text-muted-foreground mt-0.5">
                                      {new Date(src.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  )}
                                  {src.summary && (
                                    <span className="block text-[11px] text-muted-foreground/80 mt-1.5 leading-relaxed line-clamp-2">{src.summary}</span>
                                  )}
                                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-b border-r border-border rotate-45" />
                                </span>
                              </span>
                            ) : null
                          })()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-6 pb-36">
          <div className="max-w-5xl mx-auto">

            {viewType === 'brain-dump' ? (() => {
              const bdScope = selectedFolder
                ? { type: 'folder', folder: selectedFolder }
                : selectedTag
                ? { type: 'tag', tag: selectedTag }
                : { type: 'global' }
              const bdScopeKey = JSON.stringify(bdScope)
              return (
                <BrainDumpView
                  contextScope={bdScope}
                  onNoteClick={(noteId) => {
                    const note = notes.find(n => n.id === noteId)
                    if (note) setSelectedNote(note)
                  }}
                  noteCount={displayNotes.length}
                  cachedSynthesis={brainDumpCacheRef.current[bdScopeKey] || null}
                  onSynthesisLoaded={handleSynthesisLoaded}
                  isStale={brainDumpStale}
                />
              )
            })() : (
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
                  <Button onClick={startRecording} disabled={isRecording || isProcessing || usage?.warnings?.notesMax} size="sm" className="gap-1.5 shadow-sm">
                    <Mic className="w-3.5 h-3.5" /> {usage?.warnings?.notesMax ? 'Note limit reached' : 'Record your first note'}
                  </Button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="space-y-6">
                  {groupNotesByDate(displayNotes).map(group => (
                    <div key={group.label}>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">{group.label}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.notes.map(note => (
                          <NoteCard key={note.id} note={note} onClick={() => setSelectedNote(note)} onDelete={deleteNote} onStar={toggleStar} onAddTag={addTagToNote} onAddToFolder={addToFolder} onRemoveTag={removeTagFromNote} onRemoveFolder={removeFromFolder} allTags={allTags} folders={folders} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-5">
                  {groupNotesByDate(displayNotes).map(group => (
                    <div key={group.label}>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{group.label}</h3>
                      <div className="space-y-2">
                        {group.notes.map(note => (
                          <NoteRow key={note.id} note={note} onClick={() => setSelectedNote(note)} onDelete={deleteNote} onStar={toggleStar} onAddTag={addTagToNote} onAddToFolder={addToFolder} allTags={allTags} folders={folders} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom fade gradient — clean boundary above the bar */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-10" />

        {/* Bottom Bar - Stable container to prevent flicker */}
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-2 md:gap-3 z-50 w-[calc(100%-2rem)] md:w-auto justify-center">
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
            className={`flex items-end gap-3 transition-all duration-300 ease-out ${
              isRecording || isProcessing
                ? 'opacity-0 scale-95 pointer-events-none absolute'
                : 'opacity-100 scale-100'
            }`}
          >
            <button
              onClick={startRecording}
              data-onboarding="mic-button"
              className="p-4 md:p-3.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 animate-pulse-glow flex-shrink-0 mb-0.5"
            >
              <Mic className="w-5 h-5" />
            </button>
            <div data-onboarding="chat-bar">
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
              onSelectNote={(source) => {
                const note = notes.find(n => n.id === source.id)
                if (note) { setSelectedNote(note); setIsChatExpanded(false) }
              }}
              onIntentCaptured={fetchIntents}
            />
            </div>
          </div>
        </div>
        </>
        )}
      </main>

      <SettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={authUser}
        profile={userProfile}
        usage={usage}
        onClearData={handleClearAllData}
        onDeleteAccount={handleDeleteAccount}
        onCancelSubscription={handleCancelSubscription}
      />
      <CreateTagModal open={isCreateTagOpen} onClose={() => setIsCreateTagOpen(false)} onCreate={createTag} />
      <CreateFolderModal open={isCreateFolderOpen} onClose={() => setIsCreateFolderOpen(false)} onCreate={createFolder} />

      {/* Dashboard Onboarding Tour */}
      <DashboardOnboarding
        userName={userProfile?.full_name || authUser?.user_metadata?.full_name}
        isOnboardingComplete={userProfile?.dashboard_onboarding_completed === true}
        onComplete={handleCompleteOnboarding}
        onStartRecording={startRecording}
      />
    </div>
  )
}
