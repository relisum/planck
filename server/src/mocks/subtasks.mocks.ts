import {Subtask} from "../types/subtask.types";
import {faker} from "@faker-js/faker";


export function createMockSubTask(
  overrides: Partial<Subtask> = {},
) {
  return {
    id: faker.string.uuid(),
    taskId: faker.string.uuid(),
    order: faker.number.float({
      min: 1000,
      max: 100000,
      fractionDigits: 2,
    }),
    done: faker.datatype.boolean({probability: 0.35}),
    content: faker.hacker.phrase(),
    ...overrides,
  }
}