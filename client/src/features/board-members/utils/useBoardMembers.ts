import {useState} from "react"
import * as React from "react"
import {boardApi} from "@/entities/board"
import {userApi} from "@/entities/user"


const ERROR_KEYS: Record<string, string> = {
  'User not found': 'members.errors.not-found',
  'User is already a member': 'members.errors.already',
}

export function useBoardMembers(boardId: string) {
  const [username, setUsername] = useState('')
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const { data: me } = userApi.useMe()
  const { mutate: addMember, isLoading: isAdding } = boardApi.useAddMember()
  const { mutate: removeMember } = boardApi.useRemoveMember()

  function handleUsernameChange(value: string) {
    setUsername(value)
    setErrorKey(null)
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    const value = username.trim().replace(/^@/, '')
    if (!value || isAdding) return

    addMember({ boardId, username: value }, {
      onSuccess: () => setUsername(''),
      onError: (err) => {
        const message = err instanceof Error ? err.message : ''
        setErrorKey(ERROR_KEYS[message] ?? 'members.errors.generic')
      }
    })
  }

  function handleRemove(userId: string) {
    removeMember({ boardId, userId })
  }

  function handleLeave() {
    if (!me) return
    removeMember({ boardId, userId: me.id, isSelf: true })
  }

  return {
    meId: me?.id ?? null,
    username,
    errorKey,
    isAdding,
    handleUsernameChange,
    handleInvite,
    handleRemove,
    handleLeave,
  }
}
