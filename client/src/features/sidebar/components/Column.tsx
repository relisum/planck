import {useDroppable} from "@dnd-kit/react"
import {CollisionPriority} from "@dnd-kit/abstract"
import type {ReactNode} from "react"


interface ColumnProps {
  id: string
  children: ReactNode
}

export function Column({id, children}: ColumnProps): ReactNode {
  const {ref} = useDroppable({
    id,
    type: 'column',
    accept: 'item',
    collisionPriority: CollisionPriority.Low,
  });

  return (
    <div className="column" ref={ref}>
      {children}
    </div>
  )
}