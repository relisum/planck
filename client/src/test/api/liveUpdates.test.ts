import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { queryClient, CLIENT_ID } from '@/shared/api/apiClient'
import { useBoardLiveUpdates } from '@/entities/board'
import { dragLock } from '@/shared/lib/dragLock'

type Listener = (e: { data?: string }) => void

class FakeEventSource {
  static instances: FakeEventSource[] = []
  listeners = new Map<string, Listener[]>()
  closed = false
  url: string
  init?: EventSourceInit

  constructor(url: string, init?: EventSourceInit) {
    this.url = url
    this.init = init
    FakeEventSource.instances.push(this)
  }

  addEventListener(name: string, listener: Listener) {
    this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener])
  }

  emit(name: string, data?: object) {
    this.listeners.get(name)?.forEach(l => l({ data: data ? JSON.stringify(data) : undefined }))
  }

  close() {
    this.closed = true
  }
}

const source = () => FakeEventSource.instances[FakeEventSource.instances.length - 1]
type InvalidateSpy = ReturnType<typeof spyInvalidate>
const spyInvalidate = () => vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined)
const invalidatedKeys = (spy: InvalidateSpy) => spy.mock.calls.map(call => call[0])

let invalidate: InvalidateSpy

beforeEach(() => {
  FakeEventSource.instances = []
  vi.stubGlobal('EventSource', FakeEventSource)
  queryClient.clear()
  invalidate = spyInvalidate()
})

afterEach(() => {
  invalidate.mockRestore()
  vi.unstubAllGlobals()
  while (dragLock.isActive()) dragLock.end()
})

describe('useBoardLiveUpdates', () => {
  it('подписывается на поток с id вкладки и cookie', () => {
    renderHook(() => useBoardLiveUpdates())

    expect(source().url).toContain(`/events?clientId=${CLIENT_ID}`)
    expect(source().init).toEqual({ withCredentials: true })
  })

  it('по событию доски перезапрашивает доску и список досок', async () => {
    renderHook(() => useBoardLiveUpdates())

    source().emit('board', { boardId: 'b1' })

    await waitFor(() => {
      expect(invalidatedKeys(invalidate)).toEqual(expect.arrayContaining([['boards'], ['board', 'b1']]))
    })
  })

  it('пачку событий объединяет в один перезапрос на доску', async () => {
    renderHook(() => useBoardLiveUpdates())

    source().emit('board', { boardId: 'b1' })
    source().emit('board', { boardId: 'b1' })
    source().emit('board', { boardId: 'b2' })

    await waitFor(() => expect(invalidate).toHaveBeenCalled())
    expect(invalidatedKeys(invalidate)).toEqual([['boards'], ['board', 'b1'], ['board', 'b2']])
  })

  it('при отзыве доступа не перезапрашивает доску, а обновляет список', async () => {
    renderHook(() => useBoardLiveUpdates())

    source().emit('boards', { boardId: 'b1' })

    await waitFor(() => expect(invalidate).toHaveBeenCalledWith(['boards']))
    expect(invalidate).toHaveBeenCalledWith(['board', 'b1'], { refetchActive: false })
  })

  it('откладывает обновление, пока идёт перетаскивание', async () => {
    renderHook(() => useBoardLiveUpdates())

    dragLock.begin()
    source().emit('board', { boardId: 'b1' })

    await new Promise(r => setTimeout(r, 300))
    expect(invalidate).not.toHaveBeenCalled()

    dragLock.end()
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith(['board', 'b1']), { timeout: 1000 })
  })

  it('откладывает обновление, пока выполняется собственный запрос', async () => {
    const isMutating = vi.spyOn(queryClient, 'isMutating').mockReturnValue(1)
    renderHook(() => useBoardLiveUpdates())

    source().emit('board', { boardId: 'b1' })
    await new Promise(r => setTimeout(r, 300))
    expect(invalidate).not.toHaveBeenCalled()

    isMutating.mockReturnValue(0)
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith(['board', 'b1']), { timeout: 1000 })
    isMutating.mockRestore()
  })

  it('после переподключения обновляет все доски', async () => {
    renderHook(() => useBoardLiveUpdates())

    source().emit('open')
    await new Promise(r => setTimeout(r, 20))
    expect(invalidate).not.toHaveBeenCalled()

    source().emit('error')
    source().emit('open')

    await waitFor(() => {
      expect(invalidatedKeys(invalidate)).toEqual(expect.arrayContaining([['boards'], ['board']]))
    })
  })

  it('закрывает соединение при размонтировании', () => {
    const { unmount } = renderHook(() => useBoardLiveUpdates())
    unmount()

    expect(source().closed).toBe(true)
  })
})

describe('dragLock', () => {
  it('учитывает вложенные перетаскивания', () => {
    dragLock.begin()
    dragLock.begin()
    dragLock.end()
    expect(dragLock.isActive()).toBe(true)

    dragLock.end()
    expect(dragLock.isActive()).toBe(false)
  })

  it('снимается сам, если перетаскивание «зависло»', () => {
    vi.useFakeTimers()
    dragLock.begin()
    vi.advanceTimersByTime(31_000)

    expect(dragLock.isActive()).toBe(false)
    vi.useRealTimers()
  })
})
