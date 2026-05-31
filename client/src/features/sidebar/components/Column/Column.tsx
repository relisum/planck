import {useDroppable} from "@dnd-kit/react"
import {CollisionPriority} from "@dnd-kit/abstract"
import type {ReactNode} from "react"
import {MenuItem} from "@/features/sidebar/components/MenuItem/MenuItem.tsx"
import type {Board} from "@/entities/board"
import columnStyles from './column.module.sass'


interface ColumnProps {
  boards: Board[]
  activeId: string | null
  editingId: string | null
  query: string
  onSelect: (id: string) => void
  onStartEditing: (id: string) => void
  onRename: (id: string, newTitle: string) => void
  onEditingDone: () => void,
  onDelete: (id: string) => void,
  id: string
}

export function Column({
  id,
  boards,
  activeId,
  editingId,
  query,
  onSelect,
  onStartEditing,
  onRename,
  onEditingDone,
  onDelete,
}: ColumnProps): ReactNode {
  const {ref} = useDroppable({
    id,
    type: 'column',
    accept: 'menuItem',
    collisionPriority: CollisionPriority.Low,
  })

  if (boards.length === 0) {
    return (
      <p className={columnStyles.empty}>
        {query ? `Нет досок по запросу «${query}»` : 'Нет досок'}
      </p>
    )
  }

  return (
    <div ref={ref}>
      {boards.map((board, index) => (
        <MenuItem
          key={board.id}
          board={board}
          column={"sidebar__column"}
          index={index}
          query={query}
          onRename={onRename}
          onEditingDone={onEditingDone}
          onDelete={onDelete}
          isActive={board.id === activeId}
          isEditing={board.id === editingId}
          onClick={onSelect}
          onDoubleClick={onStartEditing}
        />
      ))}
    </div>
  )
}