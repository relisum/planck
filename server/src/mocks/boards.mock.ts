// Моки через faker — генерируют реалистичные данные.
// Используется для сида БД и в тестах.

import { faker } from '@faker-js/faker'
import type { Board } from '../types/board.types'

const BOARD_COLORS = [
  '#378ADD', '#D4537E', '#1D9E75',
  '#EF9F27', '#7F77DD', '#E05C5C', '#20B2AA',
]

// Генерирует одну моковую доску
export function createMockBoard(overrides: Partial<Board> = {}): Board {
  return {
    id:        faker.string.uuid(),
    title:     faker.helpers.arrayElement([
      faker.commerce.department(),
      faker.hacker.noun() + ' ' + faker.hacker.verb(),
      faker.word.adjective() + ' board',
    ]),
    color:     faker.helpers.arrayElement(BOARD_COLORS),
    taskCount: faker.number.int({ min: 0, max: 30 }),
    createdAt: faker.date.recent({ days: 60 }).toISOString(),
    active: faker.datatype.boolean(1),
    ...overrides,
  }
}

// Генерирует массив моковых досок
export function createMockBoards(count = 5): Board[] {
  return Array.from({ length: count }, () => createMockBoard())
}