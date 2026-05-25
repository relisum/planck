import type { DragEndEvent } from "@dnd-kit/react"
import {useSortable} from "@dnd-kit/react/sortable"
import type { Column as ColumnType } from "@/entities/column"
import {TaskList} from "@/features/board/components/TaskList.tsx";
import {useColumn} from "@/features/board/utils/useColumn.ts";
import {AddTaskInput} from "@/features/board/components/AddTaskInput.tsx";
import {useTaskPanel} from "@/features/task/utils/useTaskPanel.ts";
import {TaskPanel} from "@/features/task/components/TaskPanel.tsx";


interface ColumnProps {
  column: ColumnType
  boardId: string
  index: number
  onTaskDragEnd: (event: DragEndEvent) => void
  autoEdit: boolean
  handleDelete: (column: ColumnType) => void
  onFinishAutoEdit: () => void
}

export function Column({ column, boardId, index, autoEdit, handleDelete, onFinishAutoEdit }: Omit<ColumnProps, 'onTaskDragEnd'>) {
  const {
    inputRef,
    draft,
    setDraft,
    handleKeyDown,
    startEditing,
    commit,
    isEditing,
  } = useColumn({column, autoEdit, onFinishAutoEdit})

  const { task, draft: taskDraft, isClosing, open, close, onAnimationComplete, handleChange } = useTaskPanel(column.id)

  const { ref } = useSortable({
    id: column.id,
    index,
    type: 'column',
    accept: ['column'],
    group: boardId,
  })

  return (
    <>
      <div ref={ref} className="column">
        {isEditing ? (
          <div className="column__top">
            <input
              ref={inputRef}
              className="column__title column__title--editing"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={handleKeyDown}
            />
          </div>
        ) : (
          <div className="column__top">
            <h3 className="column__title" onDoubleClick={startEditing}>
              {column.title}
            </h3>
            <span
              className="column__delete"
              onClick={() => handleDelete(column)}
              role="button"
              aria-label={'Удалить колонку'}
              title={"Удалить колонку"}
            >
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11" /></svg>
            </span>
          </div>
        )}
        <AddTaskInput columnId={column.id} />
        <TaskList column={column} onOpen={open} />
      </div>
      {(task || isClosing) && (
        <TaskPanel
          task={task!}
          draft={taskDraft}
          columnId={column.id}
          onChange={handleChange}
          onClose={close}
          onAnimationComplete={onAnimationComplete}
        />
      )}
    </>
  )
}