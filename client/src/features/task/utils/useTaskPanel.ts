import { useCallback, useEffect, useRef, useState } from "react"
import { type Task, taskApi } from "@/entities/task"
import { useSubtaskManager } from "@/features/task/utils/useSubtaskManager.ts"
import {isSameDay} from "@/shared/lib/date.ts";

export function useTaskPanel(boardId: string) {
  const [task, setTask] = useState<Task | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [draft, setDraft] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { mutate: editTask } = taskApi.useEdit()
  const { mutate: changeDate } = taskApi.useChangeDate()

  const subtaskManager = useSubtaskManager(task, boardId)

  const open = useCallback((newTask: Task) => {
    setTask(prev => {
      if (prev !== null) flushSave()
      return newTask
    })
    setDraft(newTask.content)
    setIsClosing(false)
    setIsVisible(true)
  }, [])

  function close() {
    flushSave()
    setIsClosing(true)
    setTimeout(() => onAnimationComplete(), 250)
  }

  function onAnimationComplete() {
    setTask(null)
    setIsVisible(false)
    setIsClosing(false)
    setDraft('')
  }

  function flushSave() {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
      if (task) editTask({ taskId: task.id, content: draft })
    }
  }

  function handleContentChange(value: string) {
    setDraft(value)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (!task) return
      editTask({ taskId: task.id, content: value })
    }, 800)
  }

  function handleDueDateChange(date: Date | null) {
    if (!task) return

    const current = task.dueDate ? new Date(task.dueDate) : null
    if (isSameDay(current, date)) return

    setTask({ ...task, dueDate: date })
    changeDate({ task, date })
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  useEffect(() => {
    close()
  }, [boardId]);

  return {
    task,
    draft,
    isVisible,
    isClosing,
    open,
    close,
    onAnimationComplete,
    handleContentChange,
    handleDueDateChange,
    ...subtaskManager,
  }
}