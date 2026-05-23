import {useEffect, useRef, useState} from "react";
import type {Board} from "@/entities/board";
import * as React from "react";


export function useBoardItemEdit(board: Board, isEditing: boolean, onRename: (id: string, title: string) => void, onEditingDone: () => void) {
  const [draft, setDraft] = useState(board.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      setDraft(board.title)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [isEditing, board.title])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== board.title) onRename(board.id, trimmed)
    onEditingDone()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') { setDraft(board.title); onEditingDone() }
  }

  return { draft, setDraft, inputRef, commit, handleKeyDown }
}