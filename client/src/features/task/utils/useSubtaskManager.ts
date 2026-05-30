import {useCallback, useEffect, useRef} from "react"
import { subtaskApi } from "@/entities/task/api/subtask.api"
import { boardApi } from "@/entities/board"
import type { Task } from "@/entities/task"


export function useSubtaskManager(task: Task | null, boardId: string) {
  const { mutate: toggle } = subtaskApi.useToggle()
  const { mutate: change } = subtaskApi.useChange()
  const { mutate: create } = subtaskApi.useCreate()
  const { mutate: deleteSubtask } = subtaskApi.useDelete()
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const taskRef = useRef(task)

  const { data: board } = boardApi.useGetBoard({ id: boardId })
  const subtasks = board?.columns
    ?.flatMap(c => c.tasks ?? [])
    ?.find(t => t.id === task?.id)
    ?.subtasks ?? []

  useEffect(() => {
    taskRef.current = task
  }, [task])

  const handleToggle = useCallback((subtaskId: string, done: boolean) => {
    if (!taskRef.current) return
    toggle({ subtaskId, taskId: taskRef.current.id, boardId, done })
  }, [boardId])

  const handleTextChange = useCallback((subtaskId: string, content: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (!content || !taskRef.current) return
    saveTimer.current = setTimeout(() => {
      change({
        boardId,
        taskId: taskRef.current!.id,
        subtaskId,
        content
      })
    }, 850)
  }, [boardId])

  const handleAdd = useCallback((content: string) => {
    if (!content || !taskRef.current) return
    create({
      boardId,
      taskId: taskRef.current.id,
      content
    })
  }, [boardId])

  const handleDelete = useCallback((subtaskId: string) => {
    if (!subtaskId || !taskRef.current) return
    deleteSubtask({
      boardId,
      taskId: taskRef.current!.id,
      subtaskId
    })
  }, [boardId])

  return { subtasks, handleToggle, handleTextChange, handleAdd, handleDelete }
}