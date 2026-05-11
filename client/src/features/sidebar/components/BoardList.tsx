import type { Board } from '@/entities/board'
import { BoardItem } from './BoardItem'

interface BoardListProps {
  boards: Board[]
  activeId: string | null
  editingId: string | null
  query: string
  onSelect: (id: string) => void
  onStartEditing: (id: string) => void
  onRename: (id: string, newTitle: string) => void
  onEditingDone: () => void,
  onDelete: (id: string) => void,
}

export function BoardList({
  boards,
  activeId,
  editingId,
  query,
  onSelect,
  onStartEditing,
  onRename,
  onEditingDone,
  onDelete,
}: BoardListProps) {
  if (boards.length === 0) {
    return (
      <p className="board-list__empty">
        {query ? `Нет досок по запросу «${query}»` : 'Нет досок'}
      </p>
    )
  }

  return (
    <ul className="board-list" role="list">
      {boards.map((board) => (
        <li key={board.id}>
          <BoardItem
            board={board}
            isActive={board.id === activeId}
            isEditing={board.id === editingId}
            query={query}
            onClick={onSelect}
            onDoubleClick={onStartEditing}
            onRename={onRename}
            onEditingDone={onEditingDone}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  )
}
