import {useState} from 'react'
import {Sidebar} from '@/features/sidebar'
import type {Board} from '@/entities/board'
import {INITIAL_BOARDS} from "@/mocks/board.ts"
import './style.sass'
import {useInlineEdit} from "@/features/sidebar/hooks/useInlineEdit.ts";


let nextId = INITIAL_BOARDS.length + 1
const COLORS = ['#378ADD', '#D4537E', '#1D9E75', '#EF9F27', '#7F77DD', '#E05C5C', '#20B2AA']

export function App() {
  const [boards, setBoards] = useState<Board[]>(INITIAL_BOARDS)
  const [activeId, setActiveId] = useState<string | null>('1')
  const {editingId, startEditing, stopEditing} = useInlineEdit()

  function handleAdd() {
    const id = String(nextId++)
    const board: Board = {
      id,
      title: 'Новая доска',
      color: COLORS[nextId % COLORS.length],
      taskCount: 0,
    }
    setBoards((prev) => [...prev, board])
    setActiveId(id)
    startEditing(id)
  }

  function handleRename(id: string, newTitle: string) {
    setBoards((prev) =>
      prev.map((b) => (b.id === id ? { ...b, title: newTitle } : b))
    )
  }

  const activeBoard = boards.find((b) => b.id === activeId)

  return (
    <div style={{display: 'flex', height: '100vh'}}>
      <Sidebar
        boards={boards}
        activeId={activeId}
        editingId={editingId}
        onSelect={setActiveId}
        onAdd={handleAdd}
        onRename={handleRename}
        onStartEditing={startEditing}
        onEditingDone={stopEditing}
      />

      <main>
        {activeBoard ? `Доска: ${activeBoard.title}` : 'Выберите доску'}
      </main>
    </div>
  )
}