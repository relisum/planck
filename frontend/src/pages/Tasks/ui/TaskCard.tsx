import type { Task } from '@/app/types/types.ts'

type Props = {
  task: Task
}

export const TaskCard = ({ task }: Props) => {
  return (
    <div className="card">
      <div className="card-title">{task.title}</div>
      <div className="card-description">{task.description}</div>
      <div className="card-date">{task.createdAt}</div>
    </div>
  )
}