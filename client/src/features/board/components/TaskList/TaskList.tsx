import { useDroppable } from "@dnd-kit/react"
import { CollisionPriority } from "@dnd-kit/abstract"
import { Task } from "../Task/Task.tsx"
import type { Task as TaskType } from "@/entities/task"
import type { Column as ColumnType } from "@/entities/column"
import {closestCorners} from '@dnd-kit/collision'
import taskListStyle from './taskList.module.sass'


export function TaskList({ column, onOpen }: { column: ColumnType; onOpen: (task: TaskType) => void }) {
  const { ref } = useDroppable({
    id: `${column.id}__tasks`,
    accept: ['task'],
    collisionPriority: CollisionPriority.Normal,
    collisionDetector: closestCorners,
    data: { columnId: column.id },
  })

  const tasks = column.tasks ?? []

  return (
    <div ref={ref} className={taskListStyle.tasks}>
      {tasks.map((task, index) => (
        <Task key={task.id} task={task} columnId={column.id} index={index} onOpen={onOpen} />
      ))}
    </div>
  )
}