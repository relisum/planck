import React, {useEffect, useRef, useState} from 'react'
import type { Board } from '@/entities/board'
import gsap from 'gsap'


interface BoardItemProps {
  board: Board
  isActive: boolean
  isEditing: boolean
  query: string
  onClick: (id: string) => void
  onDoubleClick: (id: string) => void
  onRename: (id: string, newTitle: string) => void
  onEditingDone: () => void
  onDelete: (id: string) => void
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
  onDelete,
}: BoardItemProps) {
  const [draft, setDraft] = useState(board.title)
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const tasksCountRef = useRef<HTMLSpanElement>(null)
  const taskDeleteRef = useRef<HTMLSpanElement>(null)

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

  useEffect(() => {
    gsap.killTweensOf(tasksCountRef.current)
    gsap.killTweensOf(taskDeleteRef.current)

    if (isHovered) {
      gsap.to(tasksCountRef.current, {
        x: '-50%',
        opacity: 0,
        duration: 0.15,
        ease: 'power2.in',
      })
      gsap.fromTo(taskDeleteRef.current,
        { x: '50%', opacity: 0 },
        { x: 0, opacity: 1, duration: 0.15, ease: 'power2.out', delay: 0.1 }
      )
    } else {
      gsap.to(taskDeleteRef.current, {
        x: '50%',
        opacity: 0,
        duration: 0.15,
        ease: 'power2.in',
      })
      gsap.fromTo(tasksCountRef.current,
        { x: '-50%', opacity: 0 },
        { x: 0, opacity: 1, duration: 0.15, ease: 'power2.out', delay: 0.1 }
      )
    }
  }, [isHovered])

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      <div className="board-item__actions">
        <span className="board-item__count" ref={tasksCountRef}>
          {board.taskCount}
        </span>
        <span
          className="board-item__delete"
          ref={taskDeleteRef}
          style={{ opacity: 0 }}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(board.id)
          }}
          role="button"
          aria-label="Удалить доску"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M1 1l10 10M11 1L1 11" />
          </svg>
        </span>
      </div>

    </button>
  )
}
