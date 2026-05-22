import {Column} from "@/features/sidebar/components/Column.tsx"
import {MenuItem} from "@/features/sidebar/components/MenuItem.tsx"
import {DragDropProvider} from "@dnd-kit/react"
import '../../../features/sidebar/styles.sass'
import {useDragEnd} from "@/widgets/sidebar/utils/useDragEnd.ts";
import {useSidebar} from "@/widgets/sidebar/utils/useSidebar.ts";


export function Sidebar() {
  const { boards } = useSidebar();
  const handleDragEnd = useDragEnd()

  return (
    <aside>
      <DragDropProvider onDragEnd={handleDragEnd}>
        <Column id={"sidebar__column"}>
          {boards.map((board, index) => (
            <MenuItem key={board.id} board={board} column={"sidebar__column"} index={index} />
          ))}
        </Column>
      </DragDropProvider>

    </aside>
  )
}