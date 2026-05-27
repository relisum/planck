import { faker } from '@faker-js/faker'
import type { Column } from '../types/column.types'

export function createMockColumn(
  overrides: Partial<Column> = {}
): Column {
  const createdAt = faker.date.recent({ days: 60 })

  return {
    id: faker.string.uuid(),

    boardId: faker.string.uuid(),

    title: faker.helpers.arrayElement([
      'Todo',
      'In Progress',
      'Done',
      'Review',
      'Backlog',
    ]),

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