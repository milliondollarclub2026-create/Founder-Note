'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export const CreateFolderModal = ({ open, onClose, onCreate }) => {
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
