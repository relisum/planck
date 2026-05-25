import { boardApi } from "@/entities/board"
import { DragDropProvider } from "@dnd-kit/react"
import { Column } from "@/features/board"
import '../styles.sass'
import { useState } from "react"
import { useBoardDnd } from "../utils/useBoardDnd"
import {CreateColumn} from "@/features/board/components/CreateColumn.tsx";
import {RecoverItem} from "@/shared/components/recoverItem/RecoverItem.tsx";
import {useBoard} from "@/widgets/board/utils/useBoard.ts";
import {useSortable} from "@dnd-kit/react/sortable";

interface BoardProps {
  id: string
}

export function Board({ id }: BoardProps) {
  const { data, isLoading } = boardApi.useGetBoard({ id })
  const [newColumnId, setNewColumnId] = useState<string | null>(null)
  const { handleDragStart, handleDragOver, handleDragEnd } = useBoardDnd(id)
  const { handleRecover, handleDelete, deletedColumn, setDeletedColumn } = useBoard({ boardId: id })

  if (isLoading) return <p className="boards__empty">Загрузка...</p>

  const columns = data?.columns ?? []

  return (
    <>
      <DragDropProvider
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {columns.map((column, index) => (
          <Column
            key={column.id}
            column={column}
            boardId={id}
            index={index}
            autoEdit={column.id === newColumnId}
            handleDelete={handleDelete}
            onFinishAutoEdit={() => setNewColumnId(null)}
          />
        ))}
      </DragDropProvider>
      <CreateColumn boardId={id} setNewColumnId={setNewColumnId} />
      {deletedColumn && (
        <RecoverItem
          recoverKey={deletedColumn.id}
          onRecover={handleRecover}
          onExpire={() => setDeletedColumn(null)}
        />
      )}
    </>
  )
}