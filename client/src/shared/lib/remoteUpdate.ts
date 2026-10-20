type Listener = () => void

/**
 * Признак «сейчас применяется обновление от другого пользователя».
 * Компоненты с FLIP-анимацией снимают снимок позиций в begin и анимируют изменения до end.
 */
let depth = 0
const beginListeners = new Set<Listener>()
const endListeners = new Set<Listener>()

export const remoteUpdate = {
  begin() {
    if (depth++ === 0) beginListeners.forEach(listener => listener())
  },

  end() {
    depth = Math.max(0, depth - 1)
    if (depth === 0) endListeners.forEach(listener => listener())
  },

  isActive() {
    return depth > 0
  },

  onBegin(listener: Listener) {
    beginListeners.add(listener)
    return () => { beginListeners.delete(listener) }
  },

  onEnd(listener: Listener) {
    endListeners.add(listener)
    return () => { endListeners.delete(listener) }
  },
}
