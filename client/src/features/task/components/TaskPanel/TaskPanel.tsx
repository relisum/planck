import { useEffect, useRef } from "react"
import gsap from "gsap"
import { TaskEditor } from "../TaskEditor/TaskEditor.tsx"
import {taskApi} from "@/entities/task"
import type { Task, Subtask } from "@/entities/task"
import {SubtaskInput} from "@/features/task/components/SubtaskInput/SubtaskInput.tsx"
import {SubtaskItem} from "@/features/task/components/SubtaskItem/SubtaskItem.tsx"
import {useTranslation} from "react-i18next"
import taskPanelStyles from './taskPanel.module.sass'


interface TaskPanelProps {
  task: Task
  draft: string
  subtasks: Subtask[]
  onContentChange: (value: string) => void
  onSubtaskToggle: (id: string, done: boolean) => void
  onSubtaskTextChange: (id: string, text: string) => void
  onSubtaskAdd: (text: string) => void
  onSubtaskDelete: (id: string) => void
  onClose: () => void
  onAnimationComplete: () => void
  isClosing: boolean
}

export function TaskPanel({
  task,
  draft,
  subtasks,
  onContentChange,
  onSubtaskToggle,
  onSubtaskTextChange,
  onSubtaskAdd,
  onSubtaskDelete,
  onClose,
  onAnimationComplete,
  isClosing,
}: TaskPanelProps) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  const { mutate: deleteTask } = taskApi.useDelete()

  useEffect(() => {
    gsap.fromTo(
      panelRef.current,
      { x: '100%' },
      { x: 0, duration: 0.3, ease: 'power2.out' }
    )
  }, [])

  useEffect(() => {
    if (!isClosing) return
    gsap.to(panelRef.current, {
      x: '100%',
      duration: 0.25,
      ease: 'power2.in',
      onComplete: onAnimationComplete,
    })
  }, [isClosing])

  function handleDelete() {
    deleteTask(task)
    onClose()
  }

  return (
    <div ref={panelRef} className={taskPanelStyles.container} data-task-id={task.id}>
      <div className={taskPanelStyles.header}>
        <button className={taskPanelStyles.delete} onClick={handleDelete}>
          <svg width="8" height="8" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
          {t('board.task.delete')}
        </button>
        <span className={taskPanelStyles.number}>#{task.taskId}</span>
        <button className={taskPanelStyles.close} onClick={onClose}>
          <svg width="8" height="8" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
      </div>

      <div className={taskPanelStyles.body}>
        <TaskEditor value={draft} onChange={onContentChange} />

        <div className={taskPanelStyles.subtasks}>
          <div className={taskPanelStyles.subtasksHeader}>
            <span className={taskPanelStyles.subtasksTitle}>{t('board.task.subtasks')}</span>
          </div>

          <ul className={taskPanelStyles.subtasksList}>
            {subtasks.map(subtask => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                onToggle={onSubtaskToggle}
                onTextChange={onSubtaskTextChange}
                onDelete={onSubtaskDelete}
              />
            ))}
            <SubtaskInput onAdd={onSubtaskAdd} />
          </ul>
        </div>
      </div>
    </div>
  )
}