import { useEffect, useRef } from "react"
import gsap from "gsap"


interface TaskEditorProps {
  value: string
  onChange: (value: string) => void
}

export function TaskEditor({ value, onChange }: TaskEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const prevHeight = useRef<number>(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    el.style.height = '3.25rem'
    const targetHeight = el.scrollHeight

    el.style.height = `${prevHeight.current || targetHeight}px`

    gsap.to(el, {
      height: targetHeight,
      duration: 0.2,
      ease: 'power2.out',
      onUpdate: () => {
        el.scrollTop = 0
      },
      onComplete: () => {
        prevHeight.current = targetHeight
      }
    })
  }, [value])

  return (
    <textarea
      ref={ref}
      name={"task-description"}
      autoComplete={'off'}
      className="task-editor__textarea"
      placeholder="Введите описание задачи"
      value={value}
      rows={4}
      onChange={e => onChange(e.target.value)}
    />
  )
}