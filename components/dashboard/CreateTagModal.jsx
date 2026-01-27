'use client'

import { useState } from 'react'
import { Tag, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { TagBadge } from './TagBadge'
import { getTagStyle } from '@/lib/tag-colors'

const COLOR_OPTIONS = ['garnet', 'sage', 'amber', 'terracotta', 'slate', 'plum', 'violet', 'emerald']

export const CreateTagModal = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(() => COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)])

  const handleCreate = () => {
    if (name.trim()) {
      const tagName = name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-')
      onCreate({ name: tagName, color: selectedColor })
      setName('')
      setSelectedColor(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)])
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
              Press Enter to create
            </p>
          </div>

          {/* Color Picker */}
          <div>
            <p className="text-[10px] text-muted-foreground/60 mb-2">Choose a color</p>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_OPTIONS.map(color => {
                const style = getTagStyle(color)
                return (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${selectedColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: style.dot }}
                    title={color}
                  >
                    {selectedColor === color && <Check className="w-3 h-3 text-white" />}
                  </button>
                )
              })}
            </div>
          </div>

          {name.trim() && (
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
              <p className="text-[10px] text-muted-foreground/60 mb-2">Preview</p>
              <TagBadge tag={{ name: name.toLowerCase().replace(/[^a-z0-9-_]/g, '-'), color: selectedColor }} size="md" />
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
