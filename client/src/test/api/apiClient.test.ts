import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '@/shared/api/apiClient'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

beforeEach(() => {
  fetchMock.mockReset()
})

describe('api', () => {
  it('возвращает данные при успешном запросе', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '1', title: 'Test' }),
    })

    const result = await api('/test')
    expect(result).toEqual({ id: '1', title: 'Test' })
  })

  it('возвращает undefined при 204', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve(null),
    })

    const result = await api('/test', { method: 'DELETE' })
    expect(result).toBeUndefined()
  })

  it('возвращает null при 401', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    })

    const result = await api('/test')
    expect(result).toBeNull()
  })

  it('бросает ошибку при неуспешном запросе', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Bad Request' }),
    })

    await expect(api('/test')).rejects.toThrow('Bad Request')
  })

  it('передаёт body как JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    })

    await api('/test', { method: 'POST', body: { name: 'Roman' } })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Roman' }),
      })
    )
  })
})