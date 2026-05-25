import {type Column, columnApi} from "@/entities/column";
import {useState} from "react";


export function useBoard({ boardId }: { boardId: string }) {
  const { mutate: deleteColumn } = columnApi.useDelete()
  const { mutate: recoverColumn } = columnApi.useRestore()
  const [ deletedColumn, setDeletedColumn ] = useState<Column | null>(null)

  function handleDelete(column: Column) {
    setDeletedColumn(column)
    deleteColumn({boardId, columnId: column.id})
  }

  function handleRecover() {
    if (!deletedColumn) return
    setDeletedColumn(null)
    recoverColumn({boardId, columnId: deletedColumn.id})
  }

  return {
    handleDelete,
    handleRecover,
    deletedColumn,
    setDeletedColumn,
  }
}