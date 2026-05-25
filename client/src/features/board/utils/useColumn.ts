import { useEffect, useRef, useState } from "react"
import type { Column } from "@/entities/column"
import { columnApi } from "@/entities/column"
import * as React from "react"


interface ColumnProps {
  column: Column
  autoEdit: boolean
  onFinishAutoEdit: () => void
}

export function useColumn({column, autoEdit, onFinishAutoEdit }: ColumnProps) {
  const [isEditing, setIsEditing] = useState(autoEdit)
  const [draft, setDraft] = useState(column.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate: renameColumn } = columnApi.useRename()

  useEffect(() => {
    if (isEditing) {
      setDraft(column.title)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [isEditing])

  function startEditing() {
    setIsEditing(true)
  }

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== column.title) {
      renameColumn({ columnId: column.id, title: trimmed })
    }
    setIsEditing(false)

    if (autoEdit) {
      onFinishAutoEdit()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') {
      setDraft(column.title)
      setIsEditing(false)
    }
  }

  return { isEditing, draft, setDraft, inputRef, startEditing, commit, handleKeyDown }
}