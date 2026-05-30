import type {Subtask} from "@/entities/task"
import {useEffect, useRef} from "react"
import gsap from "gsap"


interface SubtaskItemProps {
  subtask: Subtask
  onToggle: (id: string, done: boolean) => void
  onTextChange: (id: string, text: string) => void
  onDelete: (id: string) => void
}

export function SubtaskItem({ subtask, onToggle, onTextChange, onDelete }: SubtaskItemProps) {
  const itemRef = useRef<HTMLLIElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  function handleToggle() {
    onToggle(subtask.id, !subtask.done)

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

  useEffect(() => {
    if (textRef.current) {
      textRef.current.textContent = subtask.content
    }
  }, [subtask.id])

  useEffect(() => {
    gsap.fromTo(
      itemRef.current,
      {
        opacity: 0,
        height: 0,
        marginBottom: 0
      },
      {
        opacity: 1,
        height: 'auto',
        marginBottom: '',
        duration: 0.2,
        ease: 'power2.out'
      }
    )
  }, [])

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
        onInput={e => onTextChange(subtask.id, e.currentTarget.textContent ?? '')}
      />

      <button className="subtask-item__delete" onClick={handleDelete}>
        <svg width="8" height="8" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
          <path d="M1 1l12 12M13 1L1 13" />
        </svg>
      </button>
    </li>
  )
}