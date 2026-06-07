import {useEffect, useRef, useState} from "react"
import gsap from "gsap"
import type { Task } from "@/entities/task"
import styles from './taskPriority.module.sass'
import {useTranslation} from "react-i18next";

interface TaskPriorityProps {
  current: Task['priority']
  taskId: Task['taskId']
  onChangePriority: (priority: Task['priority']) => void
}

export function TaskPriority({ current, taskId, onChangePriority }: TaskPriorityProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const { t } = useTranslation()

  const PRIORITIES: { value: Task['priority']; label: string }[] = [
    { value: null, label: t('board.task.priority.none') },
    { value: 'low',    label: t('board.task.priority.low')    },
    { value: 'medium', label: t('board.task.priority.medium') },
    { value: 'high',   label: t('board.task.priority.high')   },
  ] as const

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        close()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  function open() {
    setIsOpen(true)
    gsap.fromTo(
      dropdownRef.current,
      { y: -6, x: '50%' },
      { y: 0, x: '50%', opacity: 1, pointerEvents: 'auto', duration: 0.15, ease: 'power2.out' }
    )
  }

  function close() {
    gsap.to(dropdownRef.current, {
      opacity: 0, y: -6, x: '50%',
      pointerEvents: 'none',
      duration: 0.15, ease: 'power2.in',
      onComplete: () => setIsOpen(false)
    })
  }

  function toggle() {
    isOpen ? close() : open()
  }

  function handleSelect(priority: Task['priority']) {
    onChangePriority(priority)
    close()
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        className={styles.trigger}
        data-priority={current}
        onClick={toggle}
      >
        #{taskId}
      </button>

      <div ref={dropdownRef} className={styles.dropdown}>
        {PRIORITIES.map(({ value, label }) => (
          <button
            key={value}
            className={styles.option}
            data-priority={value}
            data-active={current === value}
            onClick={() => handleSelect(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}