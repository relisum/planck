import {boardApi} from "@/entities/board";
import type {DragEndEvent} from "@dnd-kit/react";
import {dragLock} from "@/shared/lib/dragLock";


// There's no exported type for 'sortable' on dnd-kit

export function useDragEnd() {
  const { mutate: moveBoard } = boardApi.useMove()

  return (event: DragEndEvent) => {
    dragLock.end()
    const source = event.operation.source as any

    const sourceId = source?.id as string | undefined
    const fromIndex = source?.sortable?.initialIndex as number
    const toIndex = source?.sortable?.index as number

    if (!sourceId || fromIndex === toIndex) return

    moveBoard({ sourceId, fromIndex, toIndex })
  }
}