import { z } from 'zod'

export const PASSWORD_MIN = 8

const password = z.string().min(PASSWORD_MIN).max(128)

export const PasswordRegisterSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/),
  displayName: z.string().trim().max(64).optional(),
  password,
})

export const PasswordLoginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
})

export const SetPasswordSchema = z.object({
  currentPassword: z.string().optional(),
  password,
})
