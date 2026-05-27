// features/task/components/TaskPanel.tsx
import { useEffect, useRef } from "react"
import gsap from "gsap"
import { TaskEditor } from "./TaskEditor"
import { taskApi } from "@/entities/task"
import type { Task, Subtask } from "@/entities/task"
import '../styles.sass'
import {SubtaskInput} from "@/features/task/components/SubtaskInput.tsx";


interface TaskPanelProps {
  task: Task
  draft: string
  subtasks: Subtask[]
  onContentChange: (value: string) => void
  onSubtaskToggle: (id: string) => void
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
  const panelRef = useRef<HTMLDivElement>(null)
  const { mutate: deleteTask } = taskApi.useDelete()

  // Анимация появления
  useEffect(() => {
    gsap.fromTo(
      panelRef.current,
      { x: '100%', opacity: 0 },
      { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
    )
  }, [])

  // Анимация закрытия — срабатывает когда родитель говорит isClosing=true
  useEffect(() => {
    if (!isClosing) return
    gsap.to(panelRef.current, {
      x: '100%',
      // opacity: 0,
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
    // Нет отдельного overlay-дива — клик вне панели ловит родительский layout
    <div ref={panelRef} className="task-panel">
      <div className="task-panel__header">
        <button className="task-panel__delete" onClick={handleDelete}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M1 1l10 10M11 1L1 11" />
          </svg>
          Удалить
        </button>
        <span className="task-panel__number">#{task.taskId}</span>
        <button className="task-panel__close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
      </div>

      <div className="task-panel__body">
        <TaskEditor value={draft} onChange={onContentChange} />

        <div className="task-panel__subtasks">
          <div className="subtasks__header">
            <span className="subtasks__title">Подзадачи</span>
            {/* кнопку + убираем */}
          </div>

          <ul className="subtasks__list">
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

// Вынесено отдельно — у каждого item свой ref для gsap
interface SubtaskItemProps {
  subtask: Subtask
  onToggle: (id: string) => void
  onTextChange: (id: string, text: string) => void
  onDelete: (id: string) => void
}

function SubtaskItem({ subtask, onToggle, onTextChange, onDelete }: SubtaskItemProps) {
  const itemRef = useRef<HTMLLIElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  function handleToggle() {
    onToggle(subtask.id)

    if (!subtask.done) {
      gsap.to(textRef.current, {
        textDecoration: 'line-through',
        duration: 0.2,
      })
    } else {
      gsap.to(textRef.current, {
        textDecoration: 'none',
        duration: 0.2,
      })
    }
  }

  function handleDelete() {
    gsap.to(itemRef.current, {
      opacity: 0,
      height: 0,
      marginBottom: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => onDelete(subtask.id),
    })
  }

  return (
    <li ref={itemRef} className="subtask-item">
      <button
        className={`subtask-item__checkbox ${subtask.done ? 'subtask-item__checkbox--done' : ''}`}
        onClick={handleToggle}
        aria-label={subtask.done ? 'Снять выполнение' : 'Отметить выполненным'}
      >
        {subtask.done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" />
          </svg>
        )}
      </button>

      <span
        ref={textRef}
        className="subtask-item__text"
        style={{ textDecoration: subtask.done ? 'line-through' : 'none', opacity: subtask.done ? 0.5 : 1 }}
        contentEditable
        suppressContentEditableWarning
        onBlur={e => onTextChange(subtask.id, e.currentTarget.textContent ?? '')}
      >
        {subtask.content}
      </span>

      <button className="subtask-item__delete" onClick={handleDelete}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M1 1l8 8M9 1L1 9" />
        </svg>
      </button>
    </li>
  )
}