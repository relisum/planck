import { useSortable } from "@dnd-kit/react/sortable"
import type { Task as TaskType } from "@/entities/task"
import {memo} from "react"
import {Feedback} from '@dnd-kit/dom'
import {DragDropProvider} from "@dnd-kit/react";
import {Subtask} from "./Subtask.tsx";
import {useSubtaskDnd} from "@/features/board/utils/useSubtaskDnd.ts";

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
      ref={ref}
      className="task"
      onClick={() => !isDragging && onOpen(task)}
    >
      <h3 className="task__number">#{task.taskId}</h3>
      <div className="task__content">
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