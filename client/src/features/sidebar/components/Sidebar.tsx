import type { Board } from '@/entities/board'
import { useBoardSearch } from '@/features/sidebar'
import { BoardSearch } from './BoardSearch'
import { BoardList } from './BoardList'
import '../style.sass'

interface SidebarProps {
  boards: Board[]
  activeId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
  onRename: (id: string, newTitle: string) => void
  editingId: string | null
  onStartEditing: (id: string) => void
  onEditingDone: () => void,
  onDelete: (id: string) => void,
}

export function Sidebar({
  boards,
  activeId,
  onSelect,
  onAdd,
  onRename,
  editingId,
  onStartEditing,
  onEditingDone,
  onDelete,
}: SidebarProps) {
  const { query, setQuery, filtered } = useBoardSearch(boards)

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

        <BoardList
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
      </nav>
    </aside>
  )
}
