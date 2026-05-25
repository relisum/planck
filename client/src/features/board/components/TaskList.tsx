import { useDroppable } from "@dnd-kit/react"
import { CollisionPriority } from "@dnd-kit/abstract"
import { Task } from "./Task.tsx"
import type { Task as TaskType } from "@/entities/task"
import type { Column as ColumnType } from "@/entities/column"


export function TaskList({ column, onOpen }: { column: ColumnType; onOpen: (task: TaskType) => void }) {
  const { ref } = useDroppable({
    id: `${column.id}__tasks`,
    accept: ['task'],
    collisionPriority: CollisionPriority.Low,
    data: { columnId: column.id }
  })

  const tasks = column.tasks ?? []

  return (
    <div ref={ref} className="column__tasks">
      {tasks.map((task, index) => (
        <Task key={task.id} task={task} columnId={column.id} index={index} onOpen={onOpen} />
      ))}
    </div>
  )
}