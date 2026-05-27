// useTaskPanel.ts
import { useEffect, useRef, useState } from "react"
import { type Task, type Subtask, taskApi } from "@/entities/task"

export function useTaskPanel() {
  const [task, setTask] = useState<Task | null>(null)
  const [isVisible, setIsVisible] = useState(false) // панель в DOM и анимирована
  const [isClosing, setIsClosing] = useState(false)
  const [draft, setDraft] = useState('')
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { mutate: editTask } = taskApi.useEdit()

  function open(newTask: Task) {
    const isSwitching = isVisible && task !== null

    if (isSwitching) {
      // Панель уже открыта — просто меняем контент без анимации закрытия
      flushSave()
      setTask(newTask)
      setDraft(newTask.content)
      setSubtasks(newTask.subtasks ?? [])
      return
    }

    setTask(newTask)
    setDraft(newTask.content)
    setSubtasks(newTask.subtasks ?? [])
    setIsClosing(false)
    setIsVisible(true)
  }

  function close() {
    flushSave()
    setIsClosing(true)
  }

  function onAnimationComplete() {
    setTask(null)
    setIsVisible(false)
    setIsClosing(false)
    setDraft('')
    setSubtasks([])
  }

  // Немедленно сохраняем если таймер висит (при переключении задачи)
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

  function handleSubtaskToggle(subtaskId: string) {
    setSubtasks(prev =>
      prev.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s)
    )
    // TODO: после миграции — taskApi.useEditSubtask()
  }

  function handleSubtaskTextChange(subtaskId: string, text: string) {
    setSubtasks(prev =>
      prev.map(s => s.id === subtaskId ? { ...s, text } : s)
    )
    // TODO: debounce + save
  }

  function handleSubtaskAdd() {
    const newSubtask: Subtask = {
      id: `temp-${Date.now()}`,
      content: '',
      done: false,
      order: subtasks.length,
      taskId: task!.id
    }
    setSubtasks(prev => [...prev, newSubtask])
  }

  function handleSubtaskDelete(subtaskId: string) {
    setSubtasks(prev => prev.filter(s => s.id !== subtaskId))
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  return {
    task,
    draft,
    subtasks,
    isVisible,
    isClosing,
    open,
    close,
    onAnimationComplete,
    handleContentChange,
    handleSubtaskToggle,
    handleSubtaskTextChange,
    handleSubtaskAdd,
    handleSubtaskDelete,
  }
}