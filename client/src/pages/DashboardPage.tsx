import {Sidebar, useSidebar} from "@/widgets/sidebar";
import {Board} from "@/widgets/board";
import {useTranslation} from "react-i18next";


export function DashboardPage() {
  const { t } = useTranslation()
  const sidebar = useSidebar()

  return (
    <>
      <Sidebar {...sidebar}/>
      {sidebar.activeBoard ? (
        <Board id={sidebar.activeBoard.id} />
      ) : (
        <main>
          <p className={'boards__empty'}>{t('board.choose')}</p>
        </main>
      )}
    </>
  )
}