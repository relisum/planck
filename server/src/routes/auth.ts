import { Router, Response } from 'express'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  VerifiedRegistrationResponse,
} from '@simplewebauthn/server'
import jwt from 'jsonwebtoken'
import {prisma} from '../db/client'
import {challengeStore} from "../db/challengeStore"
import {authMiddleware} from "../middleware/auth"
import {hashPassword, verifyPassword} from "../utils/password"
import {PasswordLoginSchema, PasswordRegisterSchema, SetPasswordSchema} from "../schemas/auth.schemas"
import {AppError} from "../middleware/errorHandler"


export const authRouter = Router()

const RP_NAME = 'Planck'
const RP_ID = process.env.RP_ID ?? 'localhost'
const ORIGIN = process.env.ORIGIN ?? 'http://localhost:5173'
const SECRET = process.env.JWT_SECRET!
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000

const authUserSelect = {
  id: true,
  username: true,
  displayName: true,
  passwordHash: true,
  _count: { select: { passkeys: true } },
} as const

/**
 * Публичное представление текущего пользователя (без хеша пароля)
 */
async function loadAuthUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: authUserSelect })
  if (!user) return null

  const { id, username, displayName, passwordHash, _count } = user
  return { id, username, displayName, hasPassword: passwordHash !== null, passkeys: _count.passkeys }
}

function issueSession(res: Response, userId: string) {
  const token = jwt.sign({ userId }, SECRET, { expiresIn: '30d' })

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  })
}

const passkeyChallengeKey = (userId: string) => `passkey-add:${userId}`

/**
 * /passkey/begin
 * Начать привязку passkey к текущему аккаунту
 */
authRouter.post('/passkey/begin', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { passkeys: true }
  })
  if (!user) throw new AppError(401, 'Unauthorized')

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: new TextEncoder().encode(user.id),
    userName: user.username,
    userDisplayName: user.displayName,
    attestationType: 'none',
    excludeCredentials: user.passkeys.map(p => ({
      id: p.credentialId,
      transports: JSON.parse(p.transports ?? '[]'),
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  })

  await challengeStore.set(passkeyChallengeKey(user.id), options.challenge)

  res.json({ options })
})

/**
 * /passkey/complete
 * Завершить привязку passkey к текущему аккаунту
 */
authRouter.post('/passkey/complete', authMiddleware, async (req, res) => {
  const { response } = req.body

  const challenge = await challengeStore.get(passkeyChallengeKey(req.userId))
  if (!challenge) throw new AppError(400, 'Challenge expired')

  let verification: VerifiedRegistrationResponse
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    })
  } catch {
    throw new AppError(400, 'Verification failed')
  }

  if (!verification.verified || !verification.registrationInfo) {
    throw new AppError(400, 'Verification failed')
  }

  await challengeStore.del(passkeyChallengeKey(req.userId))

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

  await prisma.passkey.create({
    data: {
      userId: req.userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: JSON.stringify(response.response?.transports ?? []),
    }
  })

  res.json(await loadAuthUser(req.userId))
})

/**
 * /login/begin
 */
authRouter.post('/login/begin', async (req, res) => {
  const { username } = req.body

  const user = await prisma.user.findUnique({
    where: { username },
    include: { passkeys: true }
  })

  if (!user) return res.status(404).json({ error: 'User not found' })
  if (user.passkeys.length === 0) return res.status(400).json({ error: 'No passkey for this user' })

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: 'preferred',
    allowCredentials: user.passkeys.map((p: any) => ({
      id: p.credentialId,
      transports: JSON.parse(p.transports ?? '[]'),
    })),
  })

  await challengeStore.set(user.id, options.challenge)

  res.json({ options, userId: user.id })
})

/**
 * /login/complete
 */
authRouter.post('/login/complete', async (req, res) => {
  const { userId, response } = req.body

  const challenge = await challengeStore.get(userId)
  if (!challenge) return res.status(400).json({ error: 'Challenge expired' })

  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: response.id }
  })

  // Ключ обязан принадлежать тому же пользователю, для которого выдан challenge
  if (!passkey || passkey.userId !== userId) return res.status(400).json({ error: 'Passkey not found' })

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    credential: {
      id: passkey.credentialId,
      publicKey: new Uint8Array(passkey.publicKey),
      counter: passkey.counter,
      transports: JSON.parse(passkey.transports ?? '[]'),
    },
  })

  if (!verification.verified) {
    return res.status(400).json({ error: 'Verification failed' })
  }

  await challengeStore.del(userId)

  await prisma.passkey.update({
    where: { id: passkey.id },
    data: { counter: verification.authenticationInfo.newCounter }
  })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return res.status(400).json({ error: 'User not found' })

  issueSession(res, user.id)

  res.json(await loadAuthUser(user.id))
})

/**
 * /register/password
 * Регистрация по логину и паролю (альтернатива passkey)
 */
authRouter.post('/register/password', async (req, res) => {
  const { username, displayName, password } = PasswordRegisterSchema.parse(req.body)

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) throw new AppError(400, 'Username already taken')

  const user = await prisma.user.create({
    data: {
      username,
      displayName: displayName || username,
      passwordHash: await hashPassword(password),
    }
  })

  issueSession(res, user.id)
  res.json(await loadAuthUser(user.id))
})

/**
 * /login/password
 * Вход по логину и паролю
 */
authRouter.post('/login/password', async (req, res) => {
  const { username, password } = PasswordLoginSchema.parse(req.body)

  const user = await prisma.user.findUnique({ where: { username } })
  const valid = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false
  if (!user || !valid) throw new AppError(400, 'Invalid username or password')

  issueSession(res, user.id)
  res.json(await loadAuthUser(user.id))
})

/**
 * /password
 * Задать или сменить пароль, чтобы входить без passkey с других устройств
 */
authRouter.post('/password', authMiddleware, async (req, res) => {
  const { currentPassword, password } = SetPasswordSchema.parse(req.body)

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) throw new AppError(401, 'Unauthorized')

  if (user.passwordHash) {
    const valid = currentPassword ? await verifyPassword(currentPassword, user.passwordHash) : false
    if (!valid) throw new AppError(400, 'Current password is incorrect')
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password) },
  })

  res.json(await loadAuthUser(updated.id))
})

/**
 * /logout
 * Logout user
 */
authRouter.post('/logout', (_, res) => {
  res.clearCookie('token')
  res.status(204).send()
})

authRouter.get('/me', async (req, res) => {
  const token = req.cookies['token']
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const { userId } = jwt.verify(token, SECRET) as { userId: string }
    const user = await loadAuthUser(userId)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    res.json(user)
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
})