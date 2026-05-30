import {DragDropProvider} from "@dnd-kit/react"
import {useDragEnd} from "@/widgets/sidebar/utils/useDragEnd.ts"
import type {Board} from "@/entities/board"
import {Column, BoardSearch, useBoardSearch, RecoverItem} from "@/features/sidebar";
import {useTheme} from "@/shared/lib/useTheme.ts";
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
  const { isDark, toggle } = useTheme()

  return (
    <aside className="sidebar" aria-label="Навигация">
      <div className="sidebar__header">
        <h1 className="sidebar__logo">Dashboard</h1>
        <label className="sidebar__theme-toggle" htmlFor="themeToggle">
          <input
            type="checkbox"
            id="themeToggle"
            checked={isDark}
            onChange={toggle}
          />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="sidebar__theme-toggle--icon"
               id="theme-toggle__svg" height="20" width="20">
            <path stroke="currentColor" fill="currentColor" strokeLinecap="round" strokeLinejoin="round"
                  d="m20.25 15.372 2.357 -2.357c0.2812 -0.2813 0.4392 -0.6627 0.4392 -1.0605 0 -0.3977 -0.158 -0.7792 -0.4392 -1.0605L20.25 8.53703v-3.337c0 -0.39783 -0.1581 -0.77936 -0.4394 -1.06066 -0.2813 -0.28131 -0.6628 -0.43934 -1.0606 -0.43934h-3.333l-2.356 -2.353c-0.1393 -0.13939 -0.3047 -0.24997 -0.4868 -0.32541C12.3922 0.946179 12.197 0.907349 12 0.907349c-0.1971 0 -0.3922 0.03883 -0.5743 0.114271 -0.182 0.07544 -0.3474 0.18602 -0.4867 0.32541l-2.35602 2.353h-3.333c-0.39783 0 -0.77936 0.15803 -1.06066 0.43934 -0.28131 0.2813 -0.43934 0.66283 -0.43934 1.06066v3.337l-2.357 2.35697c-0.28121 0.2813 -0.439184 0.6628 -0.439184 1.0605 0 0.3978 0.157974 0.7792 0.439184 1.0605l2.357 2.357V18.7c0 0.3979 0.15803 0.7794 0.43934 1.0607 0.2813 0.2813 0.66283 0.4393 1.06066 0.4393h3.333l2.35602 2.357c0.1393 0.1394 0.3047 0.25 0.4867 0.3254 0.1821 0.0755 0.3772 0.1143 0.5743 0.1143 0.197 0 0.3922 -0.0388 0.5742 -0.1143 0.1821 -0.0754 0.3475 -0.186 0.4868 -0.3254l2.356 -2.357h3.333c0.3978 0 0.7793 -0.158 1.0606 -0.4393s0.4394 -0.6628 0.4394 -1.0607v-3.328Z"
                  strokeWidth="1.5"/>
            <path className={"icon-path"} stroke="currentColor" fill="currentColor" strokeLinecap="round" strokeLinejoin="round"
                  d="M12 6.69995c1.3924 0 2.7277 0.55312 3.7123 1.53769 0.9846 0.98457 1.5377 2.31996 1.5377 3.71236 0 1.3923 -0.5531 2.7277 -1.5377 3.7123C14.7277 16.6468 13.3924 17.2 12 17.2V6.69995Z"
                  strokeWidth="1.5"/>
          </svg>
        </label>
      </div>

      <div className="sidebar__search">
        <BoardSearch value={query} onChange={setQuery}/>
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__section-header">
          <span className="sidebar__section-label">Доски</span>
          <button
            className="sidebar__add-btn"
            onClick={onAdd}
            aria-label="Добавить доску"
          >
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}
                 strokeLinecap="round" aria-hidden="true">
              <path d="M6 1v10M1 6h10"/>
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
        <RecoverItem
          recoverKey={deletedBoard.id}
          onRecover={onRestore}
          onExpire={() => setDeletedBoard(null)}
        />
      )}
    </aside>
  )
}