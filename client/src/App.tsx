import './style.sass'
import { Sidebar, useSidebar } from "@/widgets/sidebar";
import {Board} from "@/widgets/board";
import {useTranslation} from "react-i18next";


export function App() {
  const { t } = useTranslation();
  const sidebar = useSidebar();

  return (
    <>
      <Sidebar {...sidebar}/>
      <main>
        {sidebar.activeBoard ? (
          <Board id={sidebar.activeBoard.id} />
        ) : (
          <p className={"boards__empty"}>{t('board.choose')}</p>
        )}
      </main>
    </>
  )
}