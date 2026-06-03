import { Router } from 'express'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/client'

export const authRouter = Router()

const RP_NAME = 'Planck'
const RP_ID = process.env.RP_ID ?? 'localhost'
const ORIGIN = process.env.ORIGIN ?? 'http://localhost:5173'
const SECRET = process.env.JWT_SECRET!
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000

// Временное хранилище challenge (в проде — Redis)
const challenges = new Map<string, string>()

/**
 * /register/begin
 */
authRouter.post('/register/begin', async (req, res) => {
  const { username, displayName } = req.body

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) return res.status(400).json({ error: 'Username already taken' })

  const userId = crypto.randomUUID()

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: new TextEncoder().encode(userId),
    userName: username,
    userDisplayName: displayName ?? username,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  })

  challenges.set(userId, options.challenge)

  res.json({ options, userId })
})

/**
 * /register/complete
 */
authRouter.post('/register/complete', async (req, res) => {
  const { userId, username, displayName, response } = req.body

  const challenge = challenges.get(userId)
  if (!challenge) return res.status(400).json({ error: 'Challenge expired' })

  let verification
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    })
  } catch (e) {
    return res.status(400).json({ error: 'Verification failed' })
  }

  if (!verification.verified || !verification.registrationInfo) {
    return res.status(400).json({ error: 'Verification failed' })
  }

  challenges.delete(userId)

  const { credential } = verification.registrationInfo

  try {
    const user = await prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          id: userId,
          username,
          displayName: displayName ?? username,
          passkeys: {
            create: {
              credentialId: credential.id,
              publicKey: Buffer.from(credential.publicKey),
              counter: credential.counter,
              deviceType: verification.registrationInfo!.credentialDeviceType,
              backedUp: verification.registrationInfo!.credentialBackedUp,
              transports: JSON.stringify(response.response.transports ?? []),
            }
          }
        }
      })
    })

    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '30d' })

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
    })

    res.json({ user: { id: user.id, username: user.username, displayName: user.displayName, createdAt: user.createdAt } })
  } catch (e) {
    console.error('register/complete error:', e)
    res.status(500).json({ error: 'Registration failed, please try again' })
  }
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

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: 'preferred',
    allowCredentials: user.passkeys.map(p => ({
      id: p.credentialId,
      transports: JSON.parse(p.transports ?? '[]'),
    })),
  })

  challenges.set(user.id, options.challenge)

  res.json({ options, userId: user.id })
})

/**
 * /login/complete
 */
authRouter.post('/login/complete', async (req, res) => {
  const { userId, response } = req.body

  const challenge = challenges.get(userId)
  if (!challenge) return res.status(400).json({ error: 'Challenge expired' })

  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: response.id }
  })

  if (!passkey) return res.status(400).json({ error: 'Passkey not found' })

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

  challenges.delete(userId)

  await prisma.passkey.update({
    where: { id: passkey.id },
    data: { counter: verification.authenticationInfo.newCounter }
  })

  const user = await prisma.user.findUnique({ where: { id: userId } })

  const token = jwt.sign({ userId }, SECRET, { expiresIn: '30d' })

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  })

  res.json({ user: { id: user!.id, username: user!.username, displayName: user!.displayName, createdAt: user!.createdAt } })
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
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    res.json({ displayName: user.displayName })
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
})