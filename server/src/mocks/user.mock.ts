import {faker} from "@faker-js/faker";
import {User} from "../types/user.types";


export const createMockUser  = (): User => {
    return {
        id: faker.string.uuid(),
        username: faker.hacker.noun(),
        displayName: faker.hacker.noun(),
        createdAt: faker.date.recent().toISOString(),
        updatedAt: faker.date.recent().toISOString()
    }
}