import { useState } from "react"
import { useAddTask } from "../utils/useAddTask"
import * as React from "react";

interface AddTaskInputProps {
  columnId: string
}

export function AddTaskInput({ columnId }: AddTaskInputProps) {
  const [value, setValue] = useState('')
  const { handleAdd } = useAddTask(columnId)

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleAdd(value)
      setValue('')
    }
    if (e.key === 'Escape') {
      setValue('')
    }
  }

  return (
    <input
      className="column__add-task"
      placeholder="Добавить задачу"
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  )
}