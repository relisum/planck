import { useState, useCallback } from 'react'

export interface UseInlineEditReturn {
  editingId: string | null
  startEditing: (id: string) => void
  stopEditing: () => void
}

export function useInlineEdit(): UseInlineEditReturn {
  const [editingId, setEditingId] = useState<string | null>(null)

  const startEditing = useCallback((id: string) => {
    setEditingId(id)
  }, [])

  const stopEditing = useCallback(() => {
    setEditingId(null)
  }, [])

  return { editingId, startEditing, stopEditing }
}