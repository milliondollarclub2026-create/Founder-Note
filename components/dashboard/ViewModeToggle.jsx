'use client'

import { FileText, Brain } from 'lucide-react'

export const ViewModeToggle = ({ mode, onChange }) => {
  return (
    <div className="inline-flex items-center bg-secondary/40 rounded-2xl p-1 relative">
      {/* Sliding background indicator */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-card border border-border/40 rounded-xl shadow-sm transition-all duration-200 ease-out ${
          mode === 'brain-dump' ? 'left-[calc(50%+2px)]' : 'left-1'
        }`}
      />
      <button
        onClick={() => onChange('notes')}
        className={`relative flex items-center justify-center gap-1.5 w-28 py-2 text-[13px] rounded-xl transition-colors duration-200 font-medium z-10 whitespace-nowrap ${
          mode === 'notes'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground/70'
        }`}
      >
        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
        Notes
      </button>
      <button
        onClick={() => onChange('brain-dump')}
        className={`relative flex items-center justify-center gap-1.5 w-28 py-2 text-[13px] rounded-xl transition-colors duration-200 font-medium z-10 whitespace-nowrap ${
          mode === 'brain-dump'
            ? 'text-primary/90'
            : 'text-muted-foreground hover:text-foreground/70'
        }`}
      >
        <Brain className="w-3.5 h-3.5 flex-shrink-0" />
        Brain Dump
      </button>
    </div>
  )
}
