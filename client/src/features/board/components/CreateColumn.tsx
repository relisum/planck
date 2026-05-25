import {columnApi} from "@/entities/column";

export function CreateColumn({boardId, setNewColumnId}: {boardId: string, setNewColumnId: (title: string) => void}) {
  const { mutate: createColumn } = columnApi.useCreate({
    onSuccess: (col) => setNewColumnId(col.id)
  })

  function handleCreateColumn() {
    createColumn({boardId})
  }

  return (
    <button
      className={"column column__create"}
      onClick={handleCreateColumn}
    >
      Добавить колонку
    </button>
  )
}