// SubtaskInput — отдельный компонент внизу списка
import {useRef, useState} from "react";
import * as React from "react";


interface SubtaskInputProps {
  onAdd: (text: string) => void
}

export function SubtaskInput({ onAdd }: SubtaskInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    onAdd(value)
    setValue('')
    // остаётся focused автоматически — input не анмаунтится
  }

  return (
    <li className="subtask-input">
      <input
        ref={inputRef}
        className="subtask-input__field"
        placeholder="Новая подзадача..."
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </li>
  )
}