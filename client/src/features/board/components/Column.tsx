import {useSortable} from "@dnd-kit/react/sortable"
import {TaskList} from "@/features/board/components/TaskList.tsx"
import {useColumn} from "@/features/board/utils/useColumn.ts"
import {AddTaskInput} from "@/features/board/components/AddTaskInput.tsx"
import {CollisionPriority} from "@dnd-kit/abstract"
import type {Task} from "@/entities/task"
import type {Column as ColumnType} from "@/entities/column"
import {memo} from "react"
import {useTranslation} from "react-i18next";


const columnAccept = ['column', 'task']

interface ColumnProps {
  column: ColumnType
  boardId: string
  index: number
  autoEdit: boolean
  handleDelete: (column: ColumnType) => void
  onFinishAutoEdit: () => void
  onOpenTask: (task: Task) => void
}

export const Column = memo(
    function Column({
    column,
    index,
    autoEdit,
    handleDelete,
    onFinishAutoEdit,
    onOpenTask
  }: ColumnProps) {
    const { t } = useTranslation()
    const {inputRef, draft, setDraft, handleKeyDown, startEditing, commit, isEditing} =
      useColumn({column, autoEdit, onFinishAutoEdit})

    const {ref} = useSortable({
      id: column.id,
      index,
      type: 'column',
      accept: columnAccept,
      collisionPriority: CollisionPriority.Lowest,
    })

    return (
      <div ref={ref} className="column">
        <div className="column__top">
          {isEditing ? (
            <input
              ref={inputRef}
              className="column__title column__title--editing"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <h3 className="column__title" onDoubleClick={startEditing}>
              {column.title}
            </h3>
          )}
          <span
            className="column__delete"
            onClick={() => handleDelete(column)}
            role="button"
            aria-label={t('board.column.delete')}
            title={t('board.column.delete')}
          >
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}
                 strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11"/>
            </svg>
          </span>
        </div>
        <AddTaskInput columnId={column.id}/>
        <TaskList column={column} onOpen={onOpenTask}/>
      </div>
    )
  }, (prev, next) =>
    prev.column === next.column &&
    prev.index === next.index &&
    prev.autoEdit === next.autoEdit
)