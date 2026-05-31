import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET!
const COOKIE_NAME = 'token'
const MAX_AGE = 30 * 24 * 60 * 60 * 1000
const REFRESH_THRESHOLD = 14 * 24 * 60 * 60

export interface AuthPayload {
  userId: string
}

declare global {
  namespace Express {
    interface Request {
      userId: string
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[COOKIE_NAME]

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const payload = jwt.verify(token, SECRET) as AuthPayload & { exp: number }
    req.userId = payload.userId

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp - now < REFRESH_THRESHOLD) {
      const newToken = jwt.sign({ userId: payload.userId }, SECRET, { expiresIn: '30d' })
      res.cookie(COOKIE_NAME, newToken, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: MAX_AGE,
      })
    }

    next()
  } catch {
    res.clearCookie(COOKIE_NAME)
    return res.status(401).json({ error: 'Unauthorized' })
  }
}