import { useQuery } from "react-query"
import { type Task, taskApi } from "@/entities/task"
import type { Board } from "@/entities/board"

export function useTaskPriority(taskId: string, boardId: string) {
  const { mutate: changePriorityApi } = taskApi.useChangePriority()

  const { data: priority } = useQuery<Board, unknown, Task['priority']>(
    ['board', boardId],
    { enabled: false,
      select: (board) =>
        (board.columns ?? [])
          .flatMap(c => c.tasks ?? [])
          .find(t => t.id === taskId)?.priority ?? null
    }
  )

  function changePriority(newPriority: Task['priority']) {
    if (priority === newPriority) return
    changePriorityApi({
      task: { id: taskId, boardId } as Task,
      priority: newPriority
    })
  }

  return { changePriority, priority }
}