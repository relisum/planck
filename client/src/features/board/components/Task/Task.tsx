import { useSortable } from "@dnd-kit/react/sortable"
import {type Task as TaskType, taskApi} from "@/entities/task"
import {memo, useRef} from "react"
import {Feedback} from '@dnd-kit/dom'
import {DragDropProvider} from "@dnd-kit/react"
import {Subtask} from "../Subtasks/Subtask.tsx"
import {useSubtaskDnd} from "@/features/board/utils/useSubtaskDnd.ts"
import taskStyles from './task.module.sass'
import {useTranslation} from "react-i18next";
import clsx from "clsx";
import checkboxStyles from '@/shared/styles/subtasks.module.sass'

interface TaskProps {
  task: TaskType
  columnId: string
  index: number
  onOpen: (task: TaskType) => void
}

const taskPlugins = [Feedback.configure({ feedback: 'clone' })]

export const Task = memo(function Task({ task, columnId, index, onOpen }: TaskProps) {
  const { ref, isDragging } = useSortable({
    id: task.id,
    index,
    type: 'task',
    accept: ['task'],
    group: columnId,
    data: { columnId },
    plugins: taskPlugins
  })

  const { t } = useTranslation()
  const lastToggle = useRef<number>(0)
  const { handleDragStart, handleDragEnd } = useSubtaskDnd(task.id, task.boardId)

  const { mutate: toggleDone } = taskApi.useToggle()
  const handleToggle = () => {
    const now = Date.now()
    if (now - lastToggle.current < 500) return
    lastToggle.current = now

    toggleDone({ task })
  }

  return (
    <div
      data-task-id={task.id}
      ref={ref}
      className={taskStyles.container}
      onClick={() => !isDragging && onOpen(task)}
      data-priority={task.priority}
      data-done={task.done}
    >
      <div className={taskStyles.head}>
        <h3
          className={taskStyles.number}
          title={task.priority
            ? `${t(`board.task.priority.${task.priority}`)} ${t('board.task.priority-label')}`
            : t('board.task.no-priority')
          }
        >
          #{task.taskId}
        </h3>
        <button
          className={clsx(
            checkboxStyles.checkbox,
            task.done ? checkboxStyles.checkboxDone : ''
          )}
          onClick={(e) => {
            e.stopPropagation()
            handleToggle()
          }}
          aria-label={task.done ? t('board.subtask.cancel') : t('board.subtask.complete')}
        >
          {task.done && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M1.5 5l2.5 2.5 4.5-4.5" />
            </svg>
          )}
        </button>
      </div>

      {task.content.length > 0 && (
          <div className={taskStyles.content}>
            {task.content}
          </div>
      )}

      {task.subtasks && (
        <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {task.subtasks.map((subtask, index) =>
            <Subtask key={subtask.id} subtask={subtask} taskDone={task.done} index={index} boardId={task.boardId} />
          )}
        </DragDropProvider>
      )}

    </div>
  )
},(prev, next) =>
  prev.task === next.task &&
  prev.index === next.index &&
  prev.columnId === next.columnId
)