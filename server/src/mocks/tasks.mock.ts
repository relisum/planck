import {faker} from "@faker-js/faker";
import {Task} from "../types/task.types";


const STATUSES = ['todo', 'in_progress', 'done'] as const

const MOCK_CONTENTS = [
  `Разобраться с документацией и написать краткое резюме.`,

  `Основные шаги:\n- Изучить требования\n- Написать план\n- Согласовать с командой`,

  `Чеклист для ревью:\n- [ ] Проверить типы\n- [ ] Написать тесты\n- [x] Обновить доку`,

  `Быстрая задача, не требует пояснений.`,

  `Исследовать варианты реализации:\n- Вариант A — быстро, но костыльно\n- Вариант B — правильно, но дольше\n\nВыбрать оптимальный и согласовать.`,

  `Подготовить релиз:\n- [x] Прогнать тесты\n- [x] Обновить changelog\n- [ ] Уведомить команду\n- [ ] Задеплоить на стейджинг`,

  `Разобраться с багом в продакшене.\nВоспроизвести локально и найти причину.`,
]

export function createMockTask(boardId: string, order: number, overrides: Partial<Task> = {}): Task {
  return {
    id:        faker.string.uuid(),
    title:     faker.hacker.phrase(),
    content:   faker.helpers.arrayElement(MOCK_CONTENTS),
    status:    faker.helpers.arrayElement(STATUSES),
    order,
    boardId,
    createdAt: faker.date.recent({ days: 30 }).toISOString(),
    updatedAt: faker.date.recent({ days: 7 }).toISOString(),
    active:    true,
    ...overrides,
  }
}

export function createMockTasks(boardId: string, count = 5): Task[] {
  return Array.from({ length: count }, (_, i) => createMockTask(boardId, i))
}