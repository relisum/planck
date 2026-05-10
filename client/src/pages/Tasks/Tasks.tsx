import { TaskCardSkeleton } from '@/shared/ui/Skeletons/TaskCardSkeleton.tsx'
import { TaskCard } from "@/pages/Tasks/ui/TaskCard.tsx";
import { useTasksQuery } from "@/pages/Tasks/hooks.ts";


export const Tasks = () => {
  const { data: tasks, isLoading, error } = useTasksQuery()

  if (isLoading) {
    return (
      <div className="tasks-container">
        {Array(3).fill(0).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) return <div>Ошибка загрузки</div>
  if (!tasks) return null

  return (
    <div className="tasks-container">
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
}
