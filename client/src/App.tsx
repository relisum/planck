import './style.sass'
import { Sidebar, useSidebar } from "@/widgets/sidebar";
import {Board} from "@/widgets/board";


export function App() {
  const sidebar = useSidebar();

  return (
    <>
      <Sidebar {...sidebar}/>
      <main>
        {sidebar.activeBoard ? (
          <Board id={sidebar.activeBoard.id}/>
        ) : (
          <p className={"not-chose"}>Выберите доску</p>
        )}
      </main>
    </>
  )
}