interface TaskEditorProps {
  value: string
  onChange: (value: string) => void
}

export function TaskEditor({ value, onChange }: TaskEditorProps) {
  return (
    <textarea
      className="task-editor__textarea"
      placeholder="Введите описание задачи"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  )
}