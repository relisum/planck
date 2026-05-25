import { faker } from '@faker-js/faker'
import type { Task } from '../types/task.types'

export function createMockTask(
  overrides: Partial<Task> = {}
): Task {
  const createdAt = faker.date.recent({ days: 60 })

  return {
    id: faker.string.uuid(),

    boardId: faker.string.uuid(),

    columnId: faker.string.uuid(),

    taskId: faker.number.int({min: 1, max: 15}),

    // title: faker.helpers.arrayElement([
    //   faker.hacker.phrase(),
    //   faker.company.catchPhrase(),
    //   faker.git.commitMessage(),
    // ]),

    content: faker.lorem.paragraphs(2),

    order: faker.number.float({
      min: 1000,
      max: 100000,
      fractionDigits: 2,
    }),

    createdAt: createdAt.toISOString(),

    updatedAt: createdAt.toISOString(),

    deletedAt: null,

    ...overrides,
  }
}

export function createMockTasks(
  count = 10,
  overrides: Partial<Task> = {}
): Task[] {
  return Array.from(
    { length: count },
    () => createMockTask(overrides)
  )
}