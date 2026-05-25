import {taskApi} from "@/entities/task/api/task.api.ts";


export function useAddTask(columnId: string) {
  const { mutate: createTask } = taskApi.useCreate()

  function handleAdd(content: string) {
    if (!content.trim()) return
    createTask({ columnId, content })
  }

  return { handleAdd }
}