import { useState } from 'react'
import { useInlineEdit } from '@/features/sidebar/hooks/useInlineEdit'
import { useMutation, useQueryClient } from 'react-query'
import { boardApi } from '@/entities/board'

const COLORS = ['#378ADD', '#D4537E', '#1D9E75', '#EF9F27', '#7F77DD', '#E05C5C', '#20B2AA']

export function useSidebar() {
  const queryClient = useQueryClient()
  const [activeId, setActiveId] = useState<string | null>(null)
  const { editingId, startEditing, stopEditing } = useInlineEdit()

  // ─── Запросы ────────────────────────────────────────────────────────────────

  const { data, isLoading } = boardApi.useGetAll()
  const boards = data ?? []

  // ─── Мутации ────────────────────────────────────────────────────────────────

  const addMutation = useMutation(
    boardApi.create,
    {
      onSuccess: async (newBoard) => {
        await queryClient.invalidateQueries(['boards'])
        setActiveId(newBoard.id)
        startEditing(newBoard.id)
      },
    }
  )

  const renameMutation = useMutation(
    ({ id, title }: { id: string; title: string }) => boardApi.update(id, { title }),
    { onSuccess: () => queryClient.invalidateQueries(['boards']) }
  )

  const deleteMutation = useMutation(
    boardApi.remove,
    {
      onSuccess: async (_, id) => {
        await queryClient.invalidateQueries(['boards'])
        if (activeId === id) setActiveId(null)
      },
    }
  )

  // ─── Хендлеры ───────────────────────────────────────────────────────────────

  function handleAdd() {
    addMutation.mutate({
      title:     'Новая доска',
      color:     COLORS[boards.length % COLORS.length],
      taskCount: 0,
    })
  }

  const activeBoard = boards.find(b => b.id === activeId)

  return {
    boards,
    activeId,
    activeBoard,
    editingId,
    isLoading,
    onSelect:       setActiveId,
    onAdd:          handleAdd,
    onRename:       (id: string, title: string) => renameMutation.mutate({ id, title }),
    onDelete:       (id: string) => deleteMutation.mutate(id),
    onStartEditing: startEditing,
    onEditingDone:  stopEditing,
  }
}