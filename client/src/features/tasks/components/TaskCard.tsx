import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import type { Task } from '@/entities/task'
import '../style.sass'
import remarkGfm from "remark-gfm";

export function TaskCard({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      className="task-card"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="task-card__title">{task.title}</div>
      <div className="task-card__content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            p:  ({ children }) => <p className="md-p">{children}</p>,
            ul: ({ children }) => <ul className="md-ul">{children}</ul>,
            li: ({ children }) => <li className="md-li">{children}</li>,
            input: ({ checked }) => (
              <input
                type="checkbox"
                className="md-checkbox"
                defaultChecked={checked ?? false}
                readOnly
              />
            ),
          }}
        >
          {task.content}
        </ReactMarkdown>
      </div>
    </div>
  )
}