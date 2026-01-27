'use client'

import { X } from 'lucide-react'
import { getTagStyle } from '@/lib/tag-colors'

export const TagBadge = ({ tag, onRemove, size = 'sm', removable = false }) => {
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
