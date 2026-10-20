/**
 * Глобальный признак «идёт перетаскивание». Пока он активен, realtime-обновления
 * откладываются, чтобы refetch не перезаписал кэш посреди drag-and-drop.
 */
const STALE_LOCK_MS = 30_000

let active = 0
let startedAt = 0

export const dragLock = {
  begin() {
    if (active === 0) startedAt = Date.now()
    active++
  },

  end() {
    active = Math.max(0, active - 1)
  },

  isActive() {
    // Страховка от «зависшего» замка, если dragend так и не пришёл
    if (active > 0 && Date.now() - startedAt > STALE_LOCK_MS) active = 0
    return active > 0
  },
}
