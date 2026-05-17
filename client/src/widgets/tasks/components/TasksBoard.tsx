import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { TasksColumn } from './TasksColumn'
import { TaskCard } from '@/features/tasks/components/TaskCard'
import { useTasksBoard } from '../hooks/useTasksBoard'
import '../style.sass'


const STATUSES = [
  { id: 'todo',        label: 'К выполнению' },
  { id: 'in_progress', label: 'В работе' },
  { id: 'done',        label: 'Готово' },
]

export function TasksBoard({ boardId }: { boardId: string }) {
  const { tasksByStatus, activeTask, handleDragStart, handleDragOver, handleDragEnd } = useTasksBoard(boardId)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // чтобы клик не триггерил drag
    })
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="tasks-board">
        {STATUSES.map(status => (
          <TasksColumn
            key={status.id}
            status={status.id}
            label={status.label}
            tasks={tasksByStatus[status.id] ?? []}
          />
        ))}
      </div>

      {/* DragOverlay — рендерит карточку под курсором во время перетаскивания */}
      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} />}
      </DragOverlay>
    </DndContext>
  )
}