'use client'

import { useState, useMemo } from 'react'
import {
  ArrowLeft, CircleCheckBig, Lightbulb, FileText, RotateCcw
} from 'lucide-react'

// Date grouping — mirrors dashboard pattern
const groupByDate = (items, dateKey = 'created_at') => {
  const groups = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const buckets = { today: [], yesterday: [], thisWeek: [], earlier: [] }
  items.forEach(item => {
    const d = new Date(item[dateKey])
    d.setHours(0, 0, 0, 0)
    if (d >= today) buckets.today.push(item)
    else if (d >= yesterday) buckets.yesterday.push(item)
    else if (d >= weekAgo) buckets.thisWeek.push(item)
    else buckets.earlier.push(item)
  })

  if (buckets.today.length) groups.push({ label: 'Today', items: buckets.today })
  if (buckets.yesterday.length) groups.push({ label: 'Yesterday', items: buckets.yesterday })
  if (buckets.thisWeek.length) groups.push({ label: 'This Week', items: buckets.thisWeek })
  if (buckets.earlier.length) groups.push({ label: 'Earlier', items: buckets.earlier })
  return groups
}

// Format timestamp — relative for today, date for older
const formatTimestamp = (dateStr) => {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const itemDate = new Date(dateStr)
  itemDate.setHours(0, 0, 0, 0)

  if (itemDate >= today) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const CompletedView = ({
  completedTodos = [],
  completedIntents = [],
  onUncompleteTask,
  onUncompleteIntent,
  onSelectNote,
  notes = [],
  onBack
}) => {
  const [activeTab, setActiveTab] = useState('tasks') // 'tasks' | 'remembered'

  // Group items by date, sorted newest first
  const groupedTasks = useMemo(() => {
    const sorted = [...completedTodos].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return groupByDate(sorted)
  }, [completedTodos])

  const groupedIntents = useMemo(() => {
    const sorted = [...completedIntents].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return groupByDate(sorted)
  }, [completedIntents])

  const activeGroups = activeTab === 'tasks' ? groupedTasks : groupedIntents
  const taskCount = completedTodos.length
  const intentCount = completedIntents.length

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <header className="px-6 pt-6 pb-5 bg-gradient-to-br from-card to-background">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-5 -ml-0.5 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to Notes
        </button>

        {/* Title area */}
        <div className="mb-5">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-[-0.02em]">
            Wrapped Up
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Everything you've completed — with full traceability.
          </p>
        </div>

        {/* Tab toggle */}
        <div className="inline-flex items-center bg-secondary/50 border border-border/60 rounded-2xl p-1 relative">
          {/* Sliding indicator */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-card border border-border/40 rounded-xl shadow-sm transition-all duration-200 ease-out ${
              activeTab === 'remembered' ? 'left-[calc(50%+2px)]' : 'left-1'
            }`}
          />
          <button
            onClick={() => setActiveTab('tasks')}
            className={`relative flex items-center justify-center gap-1.5 w-36 py-2 text-[13px] rounded-xl transition-colors duration-200 font-medium z-10 whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/70'
            }`}
          >
            <CircleCheckBig className="w-3.5 h-3.5 flex-shrink-0" />
            Tasks
            {taskCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'tasks' ? 'bg-primary/10 text-primary/70' : 'bg-secondary text-muted-foreground'
              }`}>
                {taskCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('remembered')}
            className={`relative flex items-center justify-center gap-1.5 w-36 py-2 text-[13px] rounded-xl transition-colors duration-200 font-medium z-10 whitespace-nowrap ${
              activeTab === 'remembered'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/70'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />
            Remembered
            {intentCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'remembered' ? 'bg-primary/10 text-primary/70' : 'bg-secondary text-muted-foreground'
              }`}>
                {intentCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="max-w-3xl mx-auto">
          {activeGroups.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-72 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4">
                {activeTab === 'tasks' ? (
                  <CircleCheckBig className="w-7 h-7 text-primary/35" />
                ) : (
                  <Lightbulb className="w-7 h-7 text-primary/35" />
                )}
              </div>
              <p className="text-base font-medium text-foreground/80 mb-1">
                {activeTab === 'tasks' ? 'No completed tasks yet' : 'No archived memories'}
              </p>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                {activeTab === 'tasks'
                  ? 'Tasks you check off will appear here'
                  : 'Intents you archive will appear here'}
              </p>
            </div>
          ) : (
            /* Date-grouped items */
            <div className="space-y-6 animate-fade-in">
              {activeGroups.map((group, groupIdx) => (
                <div key={group.label}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 px-1">
                    {group.label}
                  </h3>
                  <div className="bg-card/50 border border-border/60 rounded-xl overflow-hidden">
                    {group.items.map((item, itemIdx) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 p-3 hover:bg-secondary/30 transition-all duration-150 group ${
                          itemIdx < group.items.length - 1 ? 'border-b border-border/40' : ''
                        }`}
                        style={{ animationDelay: `${(groupIdx * group.items.length + itemIdx) * 30}ms` }}
                      >
                        {/* Icon */}
                        {activeTab === 'tasks' ? (
                          <CircleCheckBig className="w-4 h-4 text-primary/40 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Lightbulb className="w-4 h-4 text-primary/40 mt-0.5 flex-shrink-0" />
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${
                            activeTab === 'tasks'
                              ? 'text-muted-foreground line-through decoration-border'
                              : 'text-foreground/80'
                          }`}>
                            {activeTab === 'tasks' ? item.title : (item.normalized_intent || item.raw_text)}
                          </p>

                          {/* Source note link */}
                          {activeTab === 'tasks' ? (
                            item.notes?.title && item.note_id && (
                              <button
                                onClick={() => onSelectNote(item.note_id)}
                                className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground hover:text-primary hover:underline transition-colors"
                              >
                                <FileText className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate max-w-[240px]">from {item.notes.title}</span>
                              </button>
                            )
                          ) : (
                            item.source_title && item.source_id && (
                              <button
                                onClick={() => onSelectNote(item.source_id)}
                                className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground hover:text-primary hover:underline transition-colors"
                              >
                                <FileText className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate max-w-[240px]">from {item.source_title}</span>
                              </button>
                            )
                          )}
                        </div>

                        {/* Right side: timestamp + restore */}
                        <div className="flex items-center gap-2.5 flex-shrink-0 mt-0.5">
                          <span className="text-[11px] text-muted-foreground/60 tabular-nums hidden sm:inline">
                            {formatTimestamp(item.completed_at || item.created_at)}
                          </span>
                          <button
                            onClick={() => {
                              if (activeTab === 'tasks') {
                                onUncompleteTask(item.id)
                              } else {
                                onUncompleteIntent(item.id)
                              }
                            }}
                            className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-primary transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span className="hidden sm:inline">Restore</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
