import {columnApi} from "@/entities/column"
import {useTranslation} from "react-i18next";

export function CreateColumn({boardId, setNewColumnId}: {boardId: string, setNewColumnId: (title: string) => void}) {
  const { t } = useTranslation()
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
      {t('board.column.create')}
    </button>
  )
}