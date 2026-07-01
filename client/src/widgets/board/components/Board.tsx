import { boardApi } from "@/entities/board"
import { DragDropProvider } from "@dnd-kit/react"
import { Column } from "@/features/board"
import { useState } from "react"
import { useBoardDnd } from "../utils/useBoardDnd"
import { CreateColumn } from "@/features/board/components/CreateColumn/CreateColumn.tsx"
import { Recover } from "@/shared/components/recover/components/Recover.tsx"
import { useBoard } from "@/widgets/board/utils/useBoard.ts"
import { useTaskPanel } from "@/features/task/utils/useTaskPanel.ts"
import { TaskPanel } from "@/features/task/components/TaskPanel/TaskPanel.tsx"
import * as React from "react"
import boardStyles from './board.module.sass'
import {useTranslation} from "react-i18next";


interface BoardProps {
  id: string
}

export function Board({ id }: BoardProps) {
  const { t } = useTranslation()
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
    handleDelete: handleDeleteSubtask,
    handleAdd,
    handleTextChange,
    handleToggle,
    handleDueDateChange
  } = useTaskPanel(id)

  const columns = data?.columns ?? []

  if (isLoading) return <p className={boardStyles.loading}>{t('board.loading')}</p>

  function handleBoardClick(e: React.MouseEvent) {
    const target = e.target as Element
    if (target.closest('[data-task-id]')) return
    close()
  }

  return (
    <main onClick={isVisible ? handleBoardClick : undefined}>
      <DragDropProvider
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          className={boardStyles.container}
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
        <Recover
          recoverKey={deletedColumn.id}
          onRecover={handleRecover}
          onExpire={() => setDeletedColumn(null)}
          position={"right"}
        />
      )}

      {isVisible && task && (
        <TaskPanel
          task={task}
          isClosing={isClosing}
          draft={draft}
          subtasks={subtasks}
          onContentChange={handleContentChange}
          onSubtaskToggle={handleToggle}
          onSubtaskTextChange={handleTextChange}
          onSubtaskAdd={handleAdd}
          onSubtaskDelete={handleDeleteSubtask}
          onClose={close}
          onAnimationComplete={onAnimationComplete}
          onDueDateChange={handleDueDateChange}
        />
      )}
    </main>
  )
}