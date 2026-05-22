import {useSortable} from "@dnd-kit/react/sortable";
import type {Board} from "@/entities/board";


interface MenuItemProps {
  column: string
  index: number
  board: Board
  onClick?: () => void
}

export function MenuItem({column, index, board, onClick}: MenuItemProps) {
  const {ref, isDragging} = useSortable({
    id: board.id,
    index,
    type: 'item',
    accept: 'item',
    group: column
  })

  return (
    <button
      className={`column__item ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
      ref={ref}
    >
      {board.title}
    </button>
  )
}