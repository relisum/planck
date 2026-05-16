import './style.sass'
import {Sidebar} from "@/widgets/sidebar/components/Sidebar.tsx";
import {useSidebar} from "@/widgets/sidebar/hooks/useSidebar.ts";


export function App() {
  const sidebar = useSidebar()

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar {...sidebar} />
      <main>
        {sidebar.activeBoard ? `Доска: ${sidebar.activeBoard.title}` : 'Выберите доску'}
      </main>
    </div>
  )
}