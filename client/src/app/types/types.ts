export interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'inProgress' | 'done'
  assignedTo?: string
  createdAt: string
  updatedAt: string
}

export interface KpiData {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
}