import clsx from "clsx"
import avatarStyles from './avatar.module.sass'


// Та же палитра, что и у цветов досок
const COLORS = ['#378ADD', '#D4537E', '#1D9E75', '#EF9F27', '#7F77DD', '#E05C5C', '#20B2AA'] as const

function colorFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

interface AvatarProps {
  id: string
  name: string
  size?: 'sm' | 'md'
  className?: string
  title?: string
}

export function Avatar({ id, name, size = 'md', className, title }: AvatarProps) {
  return (
    <span
      className={clsx(avatarStyles.avatar, avatarStyles[size], className)}
      style={{ backgroundColor: colorFor(id) }}
      title={title}
      aria-hidden={!title}
    >
      {name[0]?.toUpperCase()}
    </span>
  )
}
