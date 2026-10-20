import {prisma} from "../db/client";
import {AppError} from "../middleware/errorHandler";

export type BoardRole = 'owner' | 'member'

/**
 * Проверяет, что пользователь — участник доски. Возвращает его роль.
 * Чужая доска отдаёт 404, чтобы не раскрывать её существование.
 */
export async function requireBoardMember(boardId: string, userId: string): Promise<BoardRole> {
  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
    select: { role: true },
  })

  if (!member) throw new AppError(404, 'Board not found')

  return member.role as BoardRole
}

export async function requireBoardOwner(boardId: string, userId: string) {
  const role = await requireBoardMember(boardId, userId)
  if (role !== 'owner') throw new AppError(403, 'Only the board owner can do this')
}

export async function requireColumnAccess(columnId: string, userId: string) {
  const column = await prisma.column.findFirst({
    where: { id: columnId, board: { members: { some: { userId } } } },
  })
  if (!column) throw new AppError(404, 'Column not found')
  return column
}

export async function requireTaskAccess(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, board: { members: { some: { userId } } } },
  })
  if (!task) throw new AppError(404, 'Task not found')
  return task
}

export async function requireSubtaskAccess(subtaskId: string, userId: string) {
  const subtask = await prisma.subtasks.findFirst({
    where: { id: subtaskId, task: { board: { members: { some: { userId } } } } },
  })
  if (!subtask) throw new AppError(404, 'Subtask not found')
  return subtask
}
