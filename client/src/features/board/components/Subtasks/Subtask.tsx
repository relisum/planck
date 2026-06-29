import type {Subtask as SubtaskType} from "@/entities/task"
import {useSortable} from "@dnd-kit/react/sortable"
import {memo, useRef} from "react"
import {subtaskApi} from "@/entities/task/api/subtask.api.ts"
import {useTranslation} from "react-i18next"
import subtasksStyles from '@/shared/styles/subtasks.module.sass'
import clsx from 'clsx'


interface SubtaskProps {
  subtask: SubtaskType
  taskDone: boolean
  index: number
  boardId: string
}

export const Subtask = memo(function Subtask({ subtask, taskDone, index, boardId }: SubtaskProps) {
  const { t } = useTranslation()
  const lastToggle = useRef<number>(0)
  const done = subtask.done || taskDone
  const { ref } = useSortable({
    id: subtask.id,
    index,
    type: "subtask",
    accept: "subtask",
    group: subtask.taskId,
    data: { taskId: subtask.taskId }
  })

  const { mutate: toggle } = subtaskApi.useToggle()
  const handleToggle = () => {
    if (taskDone) return
    const now = Date.now()
    if (now - lastToggle.current < 500) return
    lastToggle.current = now

    toggle({ subtaskId: subtask.id, taskId: subtask.taskId, boardId, done: !subtask.done })
  }

  return (
    <div className={subtasksStyles.card} ref={ref}>
      <button
        className={clsx(
          subtasksStyles.checkbox,
          done ? subtasksStyles.checkboxDone : ''
        )}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle()
        }}
        aria-label={done ? t('board.subtask.cancel') : t('board.subtask.complete')}
      >
        {done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" />
          </svg>
        )}
      </button>
      <span className={subtasksStyles.subtaskContent}>{subtask.content}</span>
    </div>
  )
}, (prev, next) =>
  prev.subtask === next.subtask &&
  prev.taskDone === next.taskDone
)