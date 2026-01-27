'use client'

import { FileText, Brain } from 'lucide-react'

export const ViewModeToggle = ({ mode, onChange }) => {
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
