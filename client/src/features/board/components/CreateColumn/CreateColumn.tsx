import {columnApi} from "@/entities/column"
import {useTranslation} from "react-i18next"
import createColumnStyles from './createColumn.module.sass'

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
      className={createColumnStyles.create}
      onClick={handleCreateColumn}
    >
      {t('board.column.create')}
    </button>
  )
}