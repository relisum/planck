import { useSortable } from "@dnd-kit/react/sortable"
import type { Task as TaskType } from "@/entities/task"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface TaskProps {
  task: TaskType
  columnId: string
  index: number
  onOpen: (task: TaskType) => void
}

export function Task({ task, columnId, index, onOpen }: TaskProps) {
  const { ref, isDragging } = useSortable({
    id: task.id,
    index,
    type: 'task',
    accept: ['task'],
    group: 'tasks',
    data: { columnId },
  })

  return (
    <div
      ref={ref}
      className="task"
      onClick={() => !isDragging && onOpen(task)}
    >
      <h3 className="task__number">#{task.taskId}</h3>
      <div className="task__content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {task.content}
        </ReactMarkdown>
      </div>
    </div>
  )
}