import {type Board, boardApi} from "@/entities/board";
import {useState} from "react";
import {useInlineEdit} from "@/features/sidebar";
import {userApi} from "@/entities/user";
import {useNavigate} from "react-router-dom";
import {api, queryClient} from "@/shared/api/apiClient.ts";


export const useSidebar = () => {
  const { data, isLoading } = boardApi.useGetAll()
  const boards = data ?? []

  const navigate = useNavigate();
  const [deletedBoard, setDeletedBoard] = useState<Board | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const { editingId, startEditing, stopEditing } = useInlineEdit()
  const { mutate: restoreBoard } = boardApi.useRestore()
  const { mutate: deleteBoard } = boardApi.useDelete()
  const { mutate: renameBoard } = boardApi.useRename()
  const { mutate: create } = boardApi.useCreate(async (newBoard) => {
    setActiveId(newBoard.id)
    startEditing(newBoard.id)
  })
  const { data: user } = userApi.useMe()

  async function handleLogout() {
    await api('/auth/logout', { method: 'POST' })
    queryClient.setQueryData('me', null)
    navigate('/login', { replace: true })
  }

  function handleAdd() {
    create({title: 'Новая доска'})
  }

  function handleDelete(id: string) {
    const board = boards.find(b => b.id === id)
    setDeletedBoard(board ?? null)
    deleteBoard({id})
  }

  function handleRecover() {
    if (!deletedBoard) return
    restoreBoard({ id: deletedBoard.id })
    setDeletedBoard(null)
  }

  function handleRename(id: string, title: string) {
    renameBoard({ id, title })
  }

  const activeBoard = boards.find(board => board.id === activeId) ?? null

  return {
    boards,
    activeId,
    activeBoard,
    editingId,
    isLoading,
    deletedBoard,
    user: user ?? null,
    onLogout: handleLogout,
    onSelect:       setActiveId,
    onAdd:          handleAdd,
    onRename:       handleRename,
    onDelete:       handleDelete,
    onRestore:      handleRecover,
    onStartEditing: startEditing,
    onEditingDone:  stopEditing,
    setDeletedBoard
  }
}