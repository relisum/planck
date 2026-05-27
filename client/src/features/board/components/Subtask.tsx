import type {Subtask as SubtaskType} from "@/entities/task";
import {useSortable} from "@dnd-kit/react/sortable";
import {memo} from "react";
import {subtaskApi} from "@/entities/task/api/subtask.api.ts";


interface SubtaskProps {
  subtask: SubtaskType
  index: number
  boardId: string
}

export const Subtask = memo(function Subtask({ subtask, index, boardId }: SubtaskProps) {
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
    toggle({
      subtaskId: subtask.id,
      taskId: subtask.taskId,
      boardId,
      done: !subtask.done})
  }

  return (
    <div className={"subtask"} ref={ref}>
      <button
        className={`subtask__checkbox ${subtask.done ? 'subtask__checkbox--done' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle()
        }}
        aria-label={subtask.done ? 'Снять выполнение' : 'Отметить выполненным'}
      >
        {subtask.done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" />
          </svg>
        )}
      </button>
      <span className={"subtask__content"}>{subtask.content}</span>
    </div>
  )
}, (prev, next) => prev.subtask === next.subtask)