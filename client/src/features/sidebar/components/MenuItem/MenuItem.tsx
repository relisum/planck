import {useSortable} from "@dnd-kit/react/sortable"
import type {Board} from "@/entities/board"
import {useRef} from "react"
import {highlightMatch} from "@/features/sidebar/components/HighlightMatch/HighlightMatch.tsx"
import {useBoardItemHover} from "@/features/sidebar/utils/useBoardItemHover.ts"
import {useBoardItemEdit} from "@/features/sidebar/utils/useBoardItemEdit.ts"
import menuItemStyles from './menuItem.module.sass'
import clsx from "clsx"


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
  column: string
  index: number
}

export function MenuItem({ board, isActive, isEditing, query, onClick, onDoubleClick, onRename, onEditingDone, onDelete, column, index }: BoardItemProps) {
  const tasksCountRef = useRef<HTMLSpanElement>(null)
  const taskDeleteRef = useRef<HTMLSpanElement>(null)

  const { ref } = useSortable({
    id: board.id,
    index, type: 'menuItem',
    accept: 'menuItem',
    group: column,
    disabled: !!query
  })
  const { setIsHovered } = useBoardItemHover(tasksCountRef, taskDeleteRef)
  const { draft, setDraft, inputRef, commit, handleKeyDown } = useBoardItemEdit(board, isEditing, onRename, onEditingDone)

  if (isEditing) {
    return (
      <div
        ref={ref}
        className={clsx(
          menuItemStyles.container,
          menuItemStyles.editing,
          isActive ? menuItemStyles.active : ''
        )}
      >
        <span
          className={menuItemStyles.dot}
          style={{ backgroundColor: board.color }}
        >
          {draft[0] || board.title[0]}
        </span>
        <input
          ref={inputRef}
          className={menuItemStyles.input}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
      </div>
    )
  }

  return (
    <button
      ref={ref}
      className={clsx(
        menuItemStyles.container,
        isActive ? menuItemStyles.active : ''
      )}
      onClick={() => onClick(board.id)}
      onDoubleClick={() => onDoubleClick(board.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className={menuItemStyles.dot} style={{ backgroundColor: board.color }}>{board.title[0]}</span>
      <span className={menuItemStyles.title}>{highlightMatch(board.title, query)}</span>
      {board._count.members > 1 && (
        <svg className={menuItemStyles.shared} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-label="shared">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      )}
      <div className={menuItemStyles.actions}>
        <span className={menuItemStyles.actionsCount} ref={tasksCountRef}>{board._count.tasks}</span>
        {board.role === 'owner' && (
          <span
            className={menuItemStyles.actionsDelete}
            ref={taskDeleteRef}
            onClick={e => { e.stopPropagation(); onDelete(board.id) }}
            role="button"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11" /></svg>
          </span>
        )}
      </div>
    </button>
  )
}