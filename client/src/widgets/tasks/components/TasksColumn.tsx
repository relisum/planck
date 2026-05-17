import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskCard } from '@/features/tasks/components/TaskCard'
import type { Task } from '@/entities/task'

interface TasksColumnProps {
  status: string
  label: string
  tasks: Task[]
}

export function TasksColumn({ status, label, tasks }: TasksColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="tasks-column">
      <div className="tasks-column__header">{label}</div>
      <div
        ref={setNodeRef}
        className={`tasks-column__list${isOver ? ' tasks-column__list--over' : ''}`}
      >
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}