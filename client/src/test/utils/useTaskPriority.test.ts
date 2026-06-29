import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { createElement } from 'react'
import type { Board } from '@/entities/board'
import {type Task, taskApi} from "@/entities/task";
import {useTaskPriority} from "@/features/task/utils/useTaskPriority.ts";
import * as React from "react";

vi.mock('@/entities/task', () => ({
  taskApi: {
    useChangePriority: vi.fn(() => ({ mutate: vi.fn() })),
  },
}))

function makeWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

function makeBoard(taskId: string, priority: Task['priority']): Board {
  return {
    _count: {tasks: 0},
    color: "#ffffff",
    createdAt: new Date(),
    deletedAt: new Date(),
    order: 1000,
    updatedAt: new Date(),
    id: 'board-1',
    title: 'Test Board',
    columns: [
      {
        id: 'col-1',
        title: 'Column',
        boardId: 'board-1',
        order: 1,
        tasks: [
          {
            id: taskId,
            taskId: 1,
            columnId: 'col-1',
            boardId: 'board-1',
            content: 'Test task',
            priority,
            dueDate: null,
            done: false,
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            subtasks: [],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      },
    ]
  }
}

describe('useTaskPriority', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  it('возвращает приоритет задачи из кэша', () => {
    queryClient.setQueryData(['board', 'board-1'], makeBoard('task-1', 'high'))

    const { result } = renderHook(
      () => useTaskPriority('task-1', 'board-1'),
      { wrapper: makeWrapper(queryClient) }
    )

    expect(result.current.priority).toBe('high')
  })

  it('возвращает null если задача не найдена', () => {
    queryClient.setQueryData(['board', 'board-1'], makeBoard('task-1', null))

    const { result } = renderHook(
      () => useTaskPriority('task-1', 'board-1'),
      { wrapper: makeWrapper(queryClient) }
    )

    expect(result.current.priority).toBeNull()
  })

  it('не вызывает api если приоритет не изменился', () => {
    const mutateMock = vi.fn()
    vi.mocked(taskApi.useChangePriority).mockReturnValue({ mutate: mutateMock } as any)

    queryClient.setQueryData(['board', 'board-1'], makeBoard('task-1', 'high'))

    const { result } = renderHook(
      () => useTaskPriority('task-1', 'board-1'),
      { wrapper: makeWrapper(queryClient) }
    )

    act(() => {
      result.current.changePriority('high')
    })

    expect(mutateMock).not.toHaveBeenCalled()
  })

  it('вызывает api при смене приоритета', () => {
    const mutateMock = vi.fn()
    vi.mocked(taskApi.useChangePriority).mockReturnValue({ mutate: mutateMock } as any)

    queryClient.setQueryData(['board', 'board-1'], makeBoard('task-1', 'low'))

    const { result } = renderHook(
      () => useTaskPriority('task-1', 'board-1'),
      { wrapper: makeWrapper(queryClient) }
    )

    act(() => {
      result.current.changePriority('high')
    })

    expect(mutateMock).toHaveBeenCalledWith({
      task: expect.objectContaining({ id: 'task-1', boardId: 'board-1' }),
      priority: 'high',
    })
  })
})