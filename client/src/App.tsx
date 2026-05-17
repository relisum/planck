import './style.sass'
import {Sidebar} from "@/widgets/sidebar/components/Sidebar.tsx";
import {useSidebar} from "@/widgets/sidebar/hooks/useSidebar.ts";
import {TasksBoard} from "@/widgets/tasks/components/TasksBoard.tsx";


export function App() {
  const sidebar = useSidebar()
  // const tasksColumn = useTasksColumn(sidebar.activeId ?? '')

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar {...sidebar} />
      <main>
        {sidebar.activeId && <TasksBoard boardId={sidebar.activeId} />}
        {!sidebar.activeBoard && <div className={'not-chose'}>Выберите доску</div>}
      </main>
    </div>
  )
}