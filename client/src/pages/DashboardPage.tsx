import {Sidebar, useSidebar} from "@/widgets/sidebar";
import {Board} from "@/widgets/board";
import {useTranslation} from "react-i18next";
import {useBoardLiveUpdates} from "@/entities/board";


export function DashboardPage() {
  const { t } = useTranslation()
  const sidebar = useSidebar()
  useBoardLiveUpdates()

  return (
    <>
      <title>Dashboard | Planck</title>
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