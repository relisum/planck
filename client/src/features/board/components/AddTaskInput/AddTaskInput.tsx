import { useState } from "react"
import { useAddTask } from "../../utils/useAddTask.ts"
import * as React from "react";
import {useTranslation} from "react-i18next"
import addTaskStyle from './addTaskInput.module.sass'


interface AddTaskInputProps {
  columnId: string
}

export function AddTaskInput({ columnId }: AddTaskInputProps) {
  const { t } = useTranslation()
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
      className={addTaskStyle.input}
      placeholder={t('board.task.create')}
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  )
}