import React, {useEffect, useRef, useState} from 'react'
import type { Board } from '@/entities/board'


interface BoardItemProps {
  board: Board
  isActive: boolean
  isEditing: boolean
  query: string
  onClick: (id: string) => void
  onDoubleClick: (id: string) => void
  onRename: (id: string, newTitle: string) => void
  onEditingDone: () => void
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text

  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text

  return (
    <>
      {text.slice(0, idx)}
      <mark className="board-item__highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export function BoardItem({
  board,
  isActive,
  isEditing,
  query,
  onClick,
  onDoubleClick,
  onRename,
  onEditingDone,
}: BoardItemProps) {
  const [draft, setDraft] = useState(board.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      setDraft(board.title)
      // Небольшая задержка нужна когда элемент только появился в DOM (новая доска)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [isEditing, board.title])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== board.title) {
      onRename(board.id, trimmed)
    }
    onEditingDone()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') {
      setDraft(board.title) // откат
      onEditingDone()
    }
  }

  if (isEditing) {
    return (
      <div className={`board-item board-item--editing${isActive ? ' board-item--active' : ''}`}>
        <span
          className="board-item__dot"
          style={{ backgroundColor: board.color }}
          aria-hidden="true"
        >{draft[0] || board.title[0]}</span>
        <input
          ref={inputRef}
          className="board-item__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          aria-label="Название доски"
        />
      </div>
    )
  }

  return (
    <button
      className={`board-item${isActive ? ' board-item--active' : ''}`}
      onClick={() => onClick(board.id)}
      onDoubleClick={() => onDoubleClick(board.id)}
      aria-current={isActive ? 'page' : undefined}
    >
      <span
        className="board-item__dot"
        style={{ backgroundColor: board.color }}
        aria-hidden="true"
      >{board.title[0]}</span>
      <span className="board-item__title">
        {highlightMatch(board.title, query)}
      </span>
      <span className="board-item__count" aria-label={`${board.taskCount} задач`}>
        {board.taskCount}
      </span>
    </button>
  )
}
