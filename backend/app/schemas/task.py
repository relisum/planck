from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class Task(BaseModel):
  id: str
  title: str
  description: Optional[str] = None
  status: Literal['todo', 'inProgress', 'done']
  assignedTo: Optional[str] = None
  createdAt: datetime
  updatedAt: datetime

  class Config:
    from_attributes = True