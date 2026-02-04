from datetime import datetime
from fastapi import APIRouter
from app.schemas.task import Task

router = APIRouter()


@router.get("/", response_model=list[Task])
def get_tasks():
  now = datetime.now().strftime("%Y-%m-%d")

  return [
    Task(
      id="1",
      title="Сделать MVP",
      description="Первая версия приложения",
      status="todo",
      createdAt=now,
      updatedAt=now,
    ),
    Task(
      id="2",
      title="Сделать графики",
      status="inProgress",
      createdAt=now,
      updatedAt=now,
    ),
  ]