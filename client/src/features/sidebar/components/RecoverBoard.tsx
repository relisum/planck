import { useRecoverTimer } from '../utils/useRecoverTimer'
import { useSlideUp } from '../utils/useSlideUp'

const DURATION = 5

interface RecoverBoardProps {
  onRecover: () => void
  onExpire: () => void
}

export function RecoverBoard({ onRecover, onExpire }: RecoverBoardProps) {
  const { ref, hide } = useSlideUp(onExpire)

  const remaining = useRecoverTimer(DURATION, hide)

  const radius = 10
  const circumference = 2 * Math.PI * radius
  const progress = (remaining / DURATION) * circumference

  function handleRecover() {
    hide(() => onRecover())
  }

  return (
    <div
      ref={ref}
      className={`recover`}
    >
      <div className="recover__timer">
        <svg width="24" height="24" viewBox="0 0 24 24">
          <circle
            cx="12" cy="12" r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            transform="rotate(-90 12 12)"
          />
        </svg>
        <span className="recover__countdown">{remaining}</span>
      </div>
      <button className="recover__btn" onClick={handleRecover}>
        Восстановить
      </button>
    </div>
  )
}