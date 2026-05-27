import { boardApi } from "@/entities/board"
import { DragDropProvider } from "@dnd-kit/react"
import { Column } from "@/features/board"
import '../styles.sass'
import { useState } from "react"
import { useBoardDnd } from "../utils/useBoardDnd"
import { CreateColumn } from "@/features/board/components/CreateColumn.tsx"
import { RecoverItem } from "@/shared/components/recoverItem/RecoverItem.tsx"
import { useBoard } from "@/widgets/board/utils/useBoard.ts"
import { useTaskPanel } from "@/features/task/utils/useTaskPanel.ts"
import { TaskPanel } from "@/features/task/components/TaskPanel.tsx"
import * as React from "react";

interface BoardProps {
  id: string
}

export function Board({ id }: BoardProps) {
  const { data, isLoading } = boardApi.useGetBoard({ id })
  const [newColumnId, setNewColumnId] = useState<string | null>(null)
  const { handleDragStart, handleDragOver, handleDragEnd } = useBoardDnd(id)
  const { handleRecover, handleDelete, deletedColumn, setDeletedColumn } = useBoard({ boardId: id })
  const {
    task,
    draft,
    subtasks,
    isVisible,
    isClosing,
    open,
    close,
    onAnimationComplete,
    handleContentChange,
    handleSubtaskToggle,
    handleSubtaskTextChange,
    handleSubtaskAdd,
    handleSubtaskDelete,
  } = useTaskPanel()

  const columns = data?.columns ?? []

  if (isLoading) return <p className="boards__empty">Загрузка...</p>

  function handleBoardClick(e: React.MouseEvent) {
    const target = e.target as Element
    if (
      target.closest('.task')
    ) return
    close()
  }

  return (
    <>
      <DragDropProvider
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          className="board"
          onClick={isVisible ? handleBoardClick : undefined}
        >
          {columns.map((column, index) => (
            <Column
              key={column.id}
              column={column}
              boardId={id}
              index={index}
              autoEdit={column.id === newColumnId}
              handleDelete={handleDelete}
              onFinishAutoEdit={() => setNewColumnId(null)}
              onOpenTask={open}
            />
          ))}
        </div>
      </DragDropProvider>

      <CreateColumn boardId={id} setNewColumnId={setNewColumnId} />

      {deletedColumn && (
        <RecoverItem
          recoverKey={deletedColumn.id}
          onRecover={handleRecover}
          onExpire={() => setDeletedColumn(null)}
        />
      )}

      {isVisible && task && (
        <TaskPanel
          task={task}
          isClosing={isClosing}
          draft={draft}
          subtasks={subtasks}
          onContentChange={handleContentChange}
          onSubtaskToggle={handleSubtaskToggle}
          onSubtaskTextChange={handleSubtaskTextChange}
          onSubtaskAdd={handleSubtaskAdd}
          onSubtaskDelete={handleSubtaskDelete}
          onClose={close}
          onAnimationComplete={onAnimationComplete}
        />
      )}
    </>
  )
}