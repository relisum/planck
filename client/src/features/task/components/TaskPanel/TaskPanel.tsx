import { useEffect, useRef } from "react"
import gsap from "gsap"
import { TaskEditor } from "../TaskEditor/TaskEditor.tsx"
import {taskApi} from "@/entities/task"
import type { Task, Subtask } from "@/entities/task"
import {SubtaskInput} from "@/features/task/components/SubtaskInput/SubtaskInput.tsx"
import {SubtaskItem} from "@/features/task/components/SubtaskItem/SubtaskItem.tsx"
import {useTranslation} from "react-i18next"
import taskPanelStyles from './taskPanel.module.sass'
import {useTaskPriority} from "@/features/task/utils/useTaskPriority.ts";
import {TaskPriority} from "@/features/task/components/TaskPriority/TaskPriority.tsx";
import {DatePicker} from "@/features/task/components/DatePicker/DatePicker.tsx";


interface TaskPanelProps {
  task: Task
  draft: string
  subtasks: Subtask[]
  onContentChange: (value: string) => void
  onDueDateChange: (value: Date | null) => void
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
  onDueDateChange
}: TaskPanelProps) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  const { mutate: deleteTask } = taskApi.useDelete()
  const { changePriority, priority } = useTaskPriority(task.id, task.boardId)

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
          <svg className="trash-bin-icon" width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.5001 6H3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M18.8332 8.5L18.3732 15.3991C18.1962 18.054 18.1077 19.3815 17.2427 20.1907C16.3777 21 15.0473 21 12.3865 21H11.6132C8.95235 21 7.62195 21 6.75694 20.1907C5.89194 19.3815 5.80344 18.054 5.62644 15.3991L5.1665 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M9.5 11L10 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M14.5 11L14 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M6.5 6C6.55588 6 6.58382 6 6.60915 5.99936C7.43259 5.97849 8.15902 5.45491 8.43922 4.68032C8.44784 4.65649 8.45667 4.62999 8.47434 4.57697L8.57143 4.28571C8.65431 4.03708 8.69575 3.91276 8.75071 3.8072C8.97001 3.38607 9.37574 3.09364 9.84461 3.01877C9.96213 3 10.0932 3 10.3553 3H13.6447C13.9068 3 14.0379 3 14.1554 3.01877C14.6243 3.09364 15.03 3.38607 15.2493 3.8072C15.3043 3.91276 15.3457 4.03708 15.4286 4.28571L15.5257 4.57697C15.5433 4.62992 15.5522 4.65651 15.5608 4.68032C15.841 5.45491 16.5674 5.97849 17.3909 5.99936C17.4162 6 17.4441 6 17.5 6" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          {t('board.task.delete')}
        </button>
        <TaskPriority current={priority ?? null} onChangePriority={changePriority} taskId={task.taskId}/>
        <button className={taskPanelStyles.close} onClick={onClose}>
          <svg width="8" height="8" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
      </div>

      <div className={taskPanelStyles.body}>
        <TaskEditor value={draft} onChange={onContentChange} />

        <div className={taskPanelStyles.subtasks}>
          <span className={taskPanelStyles.subtasksTitle}>{t('board.task.date.deadline')}</span>
          <DatePicker
            value={task.dueDate ? new Date(task.dueDate) : null}
            onChange={onDueDateChange}
          />
        </div>


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