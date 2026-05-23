import {DragDropProvider} from "@dnd-kit/react"
import {useDragEnd} from "@/widgets/sidebar/utils/useDragEnd.ts"
import type {Board} from "@/entities/board"
import {Column, BoardSearch, useBoardSearch, RecoverBoard} from "@/features/sidebar";
import '../styles.sass'


interface SidebarProps {
  boards: Board[]
  activeId: string | null
  activeBoard: Board | null
  editingId: string | null
  isLoading: boolean
  deletedBoard: Board | null
  onSelect: (id: string) => void
  onAdd: () => void
  onRename: (id: string, newTitle: string) => void
  onDelete: (id: string) => void,
  onRestore: () => void
  onStartEditing: (id: string) => void
  onEditingDone: () => void,
  setDeletedBoard: (id: Board | null) => void,
}

export function Sidebar({boards,
  activeId,
  editingId,
  isLoading,
  deletedBoard,
  onSelect,
  onAdd,
  onRename,
  onDelete,
  onRestore,
  onStartEditing,
  onEditingDone,
  setDeletedBoard
}: SidebarProps) {
  const { query, setQuery, filtered } = useBoardSearch(boards)
  const handleDragEnd = useDragEnd()

  return (
    <aside className="sidebar" aria-label="Навигация">
      <div className="sidebar__header">
        <h1 className="sidebar__logo">Dashboard</h1>
      </div>

      <div className="sidebar__search">
        <BoardSearch value={query} onChange={setQuery} />
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__section-header">
          <span className="sidebar__section-label">Доски</span>
          <button
            className="sidebar__add-btn"
            onClick={onAdd}
            aria-label="Добавить доску"
          >
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M6 1v10M1 6h10" />
            </svg>
            Добавить
          </button>
        </div>
        {isLoading ? (
          <p className={"sidebar__loading"}>Загрузка...</p>
        ) : (
          <DragDropProvider onDragEnd={handleDragEnd}>
            <Column
              id={"sidebar__column"}
              boards={filtered}
              activeId={activeId}
              editingId={editingId}
              query={query}
              onSelect={onSelect}
              onStartEditing={onStartEditing}
              onRename={onRename}
              onEditingDone={onEditingDone}
              onDelete={onDelete}
            />
          </DragDropProvider>
        )}
      </nav>
      {deletedBoard && (
        <RecoverBoard
          onRecover={onRestore}
          onExpire={() => setDeletedBoard(null)}
        />
      )}
    </aside>
)
}