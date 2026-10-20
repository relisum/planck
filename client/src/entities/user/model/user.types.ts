export interface User {
  id: string
  username: string
  displayName: string
  hasPassword: boolean
  /** Количество привязанных passkey */
  passkeys: number
}
