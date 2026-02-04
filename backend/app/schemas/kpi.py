from pydantic import BaseModel

class KpiData(BaseModel):
  totalTasks: int
  completedTasks: int
  inProgressTasks: int