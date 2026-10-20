import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Client, PASSWORD, registerUser, startServer, stopServer, uniqueName } from './helpers'
import { prisma } from '../src/db/client'

beforeAll(startServer)
afterAll(stopServer)

describe('регистрация по паролю', () => {
  it('создаёт пользователя, ставит cookie и не отдаёт хеш пароля', async () => {
    const client = new Client()
    const username = uniqueName()

    const res = await client.post('/auth/register/password', { username, displayName: 'Alice', password: PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      id: expect.any(String),
      username,
      displayName: 'Alice',
      hasPassword: true,
      passkeys: 0,
    })
    expect(client.cookie).toMatch(/^token=/)

    const stored = await prisma.user.findUnique({ where: { username } })
    expect(stored?.passwordHash).toMatch(/^scrypt\$/)
    expect(stored?.passwordHash).not.toContain(PASSWORD)
  })

  it('по умолчанию использует логин как отображаемое имя', async () => {
    const { user } = await registerUser()
    expect(user.displayName).toBe(user.username)
  })

  it('отклоняет занятый логин', async () => {
    const { user } = await registerUser()
    const res = await new Client().post('/auth/register/password', { username: user.username, password: PASSWORD })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Username already taken')
  })

  it.each([
    ['короткий пароль', { username: uniqueName(), password: '1234567' }],
    ['короткий логин', { username: 'ab', password: PASSWORD }],
    ['недопустимые символы в логине', { username: 'bad name!', password: PASSWORD }],
  ])('валидирует данные: %s', async (_, body) => {
    const res = await new Client().post('/auth/register/password', body)
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation error')
  })
})

describe('вход по паролю', () => {
  it('пускает с верным паролем', async () => {
    const { user } = await registerUser()
    const client = new Client()

    const res = await client.post('/auth/login/password', { username: user.username, password: PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(user.id)
    expect((await client.get('/auth/me')).body.id).toBe(user.id)
  })

  it('одинаково отвечает на неверный пароль и несуществующего пользователя', async () => {
    const { user } = await registerUser()

    const wrongPassword = await new Client().post('/auth/login/password', { username: user.username, password: 'wrong-password' })
    const unknownUser = await new Client().post('/auth/login/password', { username: uniqueName(), password: PASSWORD })

    expect(wrongPassword.status).toBe(400)
    expect(unknownUser.status).toBe(400)
    expect(wrongPassword.body).toEqual(unknownUser.body)
  })

  it('не пускает по паролю пользователя без пароля (старый passkey-аккаунт)', async () => {
    const username = uniqueName('legacy')
    await prisma.user.create({ data: { username, displayName: 'Legacy' } })

    const res = await new Client().post('/auth/login/password', { username, password: PASSWORD })
    expect(res.status).toBe(400)
  })
})

describe('/auth/me и выход', () => {
  it('без cookie отвечает 401', async () => {
    expect((await new Client().get('/auth/me')).status).toBe(401)
  })

  it('после logout сессия сбрасывается', async () => {
    const { client } = await registerUser()
    await client.post('/auth/logout')
    client.cookie = null

    expect((await client.get('/auth/me')).status).toBe(401)
    expect((await client.get('/boards')).status).toBe(401)
  })
})

describe('установка пароля', () => {
  it('passkey-пользователь задаёт пароль без текущего и затем входит по нему', async () => {
    const username = uniqueName('legacy')
    const legacy = await prisma.user.create({ data: { username, displayName: 'Legacy' } })
    const client = await loginAs(legacy.id)

    const res = await client.post('/auth/password', { password: 'brand-new-pass' })
    expect(res.status).toBe(200)
    expect(res.body.hasPassword).toBe(true)

    const login = await new Client().post('/auth/login/password', { username, password: 'brand-new-pass' })
    expect(login.status).toBe(200)
  })

  it('смена существующего пароля требует текущий', async () => {
    const { client, user } = await registerUser()

    const withoutCurrent = await client.post('/auth/password', { password: 'another-pass' })
    expect(withoutCurrent.status).toBe(400)

    const wrongCurrent = await client.post('/auth/password', { currentPassword: 'nope-nope', password: 'another-pass' })
    expect(wrongCurrent.status).toBe(400)
    expect(wrongCurrent.body.error).toBe('Current password is incorrect')

    const ok = await client.post('/auth/password', { currentPassword: PASSWORD, password: 'another-pass' })
    expect(ok.status).toBe(200)

    const oldLogin = await new Client().post('/auth/login/password', { username: user.username, password: PASSWORD })
    const newLogin = await new Client().post('/auth/login/password', { username: user.username, password: 'another-pass' })
    expect(oldLogin.status).toBe(400)
    expect(newLogin.status).toBe(200)
  })

  it('недоступна без авторизации', async () => {
    expect((await new Client().post('/auth/password', { password: 'another-pass' })).status).toBe(401)
  })
})

describe('passkey', () => {
  it('привязка ключа доступна только авторизованному пользователю', async () => {
    expect((await new Client().post('/auth/passkey/begin')).status).toBe(401)

    const { client, user } = await registerUser()
    const res = await client.post('/auth/passkey/begin')

    expect(res.status).toBe(200)
    expect(res.body.options.challenge).toEqual(expect.any(String))
    expect(res.body.options.user.name).toBe(user.username)
  })

  it('регистрация через passkey больше не доступна', async () => {
    const res = await new Client().post('/auth/register/begin', { username: uniqueName() })
    expect(res.status).toBe(401)
  })

  it('вход по ключу для пользователя без ключей отклоняется', async () => {
    const { user } = await registerUser()
    const res = await new Client().post('/auth/login/begin', { username: user.username })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('No passkey for this user')
  })

  it('чужой ключ не подходит для входа в аккаунт жертвы', async () => {
    const { user: victim } = await registerUser('victim')
    const { user: attacker } = await registerUser('attacker')
    await addPasskey(victim.id, uniqueName('victim-cred'))
    const attackerCredential = uniqueName('attacker-cred')
    await addPasskey(attacker.id, attackerCredential)

    const begin = await new Client().post('/auth/login/begin', { username: victim.username })
    expect(begin.status).toBe(200)

    const client = new Client()
    const res = await client.post('/auth/login/complete', {
      userId: victim.id,
      response: { id: attackerCredential, rawId: attackerCredential, type: 'public-key', response: {} },
    })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Passkey not found')
    expect(client.cookie).toBeNull()
  })
})

async function addPasskey(userId: string, credentialId: string) {
  await prisma.passkey.create({
    data: { userId, credentialId, publicKey: Buffer.from('key'), deviceType: 'singleDevice' },
  })
}

/**
 * Сессия для пользователя без пароля (имитация входа по passkey)
 */
async function loginAs(userId: string) {
  const jwt = await import('jsonwebtoken')
  const client = new Client()
  client.cookie = `token=${jwt.default.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '1h' })}`
  return client
}
