import { DragDropProvider } from '@dnd-kit/react'
import { useDragEnd } from '@/widgets/sidebar/utils/useDragEnd'
import type { Board } from '@/entities/board'
import type { User } from '@/entities/user'
import { Column, BoardSearch, useBoardSearch, RecoverItem, SidebarHeader, SidebarFooter } from '@/features/sidebar'
import { useTranslation } from 'react-i18next'
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
  onDelete: (id: string) => void
  onRestore: () => void
  onStartEditing: (id: string) => void
  onEditingDone: () => void
  setDeletedBoard: (id: Board | null) => void
  user: User | null
  onLogout: () => void
}

export function Sidebar({
  boards, activeId, editingId, isLoading, deletedBoard,
  onSelect, onAdd, onRename, onDelete, onRestore,
  onStartEditing, onEditingDone, setDeletedBoard,
  user, onLogout
}: SidebarProps) {
  const { t } = useTranslation()
  const { query, setQuery, filtered } = useBoardSearch(boards)
  const handleDragEnd = useDragEnd()

  return (
    <aside className="sidebar" aria-label="Навигация">
      <SidebarHeader />

      <div className="sidebar__search">
        <BoardSearch value={query} onChange={setQuery} />
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__section-header">
          <span className="sidebar__section-label">{t('sidebar.boards')}</span>
          <button className="sidebar__add-btn" onClick={onAdd} aria-label="Добавить доску">
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M6 1v10M1 6h10"/>
            </svg>
            {t('sidebar.add')}
          </button>
        </div>

        {isLoading ? (
          <p className="sidebar__loading">{t('sidebar.loading')}...</p>
        ) : (
          <DragDropProvider onDragEnd={handleDragEnd}>
            <Column
              id="sidebar__column"
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
        <RecoverItem
          recoverKey={deletedBoard.id}
          onRecover={onRestore}
          onExpire={() => setDeletedBoard(null)}
        />
      )}

      <SidebarFooter user={user} onLogout={onLogout} />
    </aside>
  )
}