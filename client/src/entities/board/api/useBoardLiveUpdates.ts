import { useEffect } from 'react'
import { queryClient } from '@/shared/api/apiClient'
import { subscribeServerEvents } from '@/shared/api/serverEvents'
import { dragLock } from '@/shared/lib/dragLock'
import { remoteUpdate } from '@/shared/lib/remoteUpdate'

const RETRY_MS = 250
// Сколько ждать после refetch, пока React применит новые данные (для FLIP-анимации)
const SETTLE_MS = 150

/**
 * Realtime-обновления досок: по событию сервера перезапрашивает изменённые данные.
 * Пока идёт перетаскивание или собственный запрос, обновление откладывается,
 * чтобы не перетереть оптимистичное состояние.
 */
export function useBoardLiveUpdates() {
  useEffect(() => {
    const changedBoards = new Set<string>()
    const revokedBoards = new Set<string>()
    let boardsChanged = false
    let everything = false
    let timer: ReturnType<typeof setTimeout> | null = null

    function flush() {
      timer = null

      if (dragLock.isActive() || queryClient.isMutating() > 0) {
        timer = setTimeout(flush, RETRY_MS)
        return
      }

      remoteUpdate.begin()
      const refetches: Promise<unknown>[] = []

      if (everything) {
        refetches.push(queryClient.invalidateQueries(['boards']))
        refetches.push(queryClient.invalidateQueries(['board']))
      } else {
        if (boardsChanged) refetches.push(queryClient.invalidateQueries(['boards']))
        changedBoards.forEach(id => refetches.push(queryClient.invalidateQueries(['board', id])))
        // Доступ к доске отозван — не перезапрашиваем её, только помечаем устаревшей
        revokedBoards.forEach(id => refetches.push(queryClient.invalidateQueries(['board', id], { refetchActive: false })))
      }

      Promise.allSettled(refetches).then(() => setTimeout(remoteUpdate.end, SETTLE_MS))

      changedBoards.clear()
      revokedBoards.clear()
      boardsChanged = false
      everything = false
    }

    function schedule() {
      if (!timer) timer = setTimeout(flush, 0)
    }

    const unsubscribe = subscribeServerEvents({
      onEvent: (event, { boardId }) => {
        boardsChanged = true
        if (boardId) {
          if (event === 'board') changedBoards.add(boardId)
          else revokedBoards.add(boardId)
        }
        schedule()
      },
      onReconnect: () => {
        everything = true
        schedule()
      },
    })

    return () => {
      unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [])
}
