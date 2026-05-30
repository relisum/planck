import {useEffect, useRef, useState} from "react";
import * as React from "react";
import gsap from "gsap";
import {useTranslation} from "react-i18next";


interface SubtaskInputProps {
  onAdd: (text: string) => void
}

export function SubtaskInput({ onAdd }: SubtaskInputProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const prevHeight = useRef<number>(0)

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    onAdd(value)
    setValue('')
  }

  useEffect(() => {
    const el = inputRef.current
    if (!el) return

    el.style.height = '2rem'
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
    <li className="subtask-input">
      <textarea
        name={"subtask-input"}
        autoComplete={"off"}
        ref={inputRef}
        className="subtask-input__field"
        placeholder={t('board.subtasks.new')}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </li>
  )
}