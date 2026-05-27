import { faker } from '@faker-js/faker'
import type { Board } from '../types/board.types'

const BOARD_COLORS = [
  '#378ADD',
  '#D4537E',
  '#1D9E75',
  '#EF9F27',
  '#7F77DD',
  '#E05C5C',
  '#20B2AA',
]

export function createMockBoard(
  overrides: Partial<Board> = {}
): Board {
  const createdAt = faker.date.recent({ days: 60 })

  return {
    id: faker.string.uuid(),

    title: faker.helpers.arrayElement([
      faker.commerce.department(),
      faker.hacker.noun() + ' ' + faker.hacker.verb(),
      faker.word.adjective() + ' board',
    ]),

    order: faker.number.float({ multipleOf: 1000, min: 1000, max: 10000 }),

    color: faker.helpers.arrayElement(BOARD_COLORS),

    createdAt: createdAt.toISOString(),

    updatedAt: createdAt.toISOString(),

    deletedAt: null,

    ...overrides,
  }
}