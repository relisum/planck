import { useSortable } from "@dnd-kit/react/sortable"
import type { Task as TaskType } from "@/entities/task"
import {memo} from "react"
import {Feedback} from '@dnd-kit/dom'
import {DragDropProvider} from "@dnd-kit/react"
import {Subtask} from "../Subtasks/Subtask.tsx"
import {useSubtaskDnd} from "@/features/board/utils/useSubtaskDnd.ts"
import taskStyles from './task.module.sass'

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

  const { handleDragStart, handleDragEnd } = useSubtaskDnd(task.id, task.boardId)

  return (
    <div
      data-task-id={task.id}
      ref={ref}
      className={taskStyles.container}
      onClick={() => !isDragging && onOpen(task)}
    >
      <h3 className={taskStyles.number}>#{task.taskId}</h3>
      <div className={taskStyles.content}>
        {task.content}
      </div>
      {task.subtasks && (
        <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {task.subtasks.map((subtask, index) =>
            <Subtask key={subtask.id} subtask={subtask} index={index} boardId={task.boardId} />
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