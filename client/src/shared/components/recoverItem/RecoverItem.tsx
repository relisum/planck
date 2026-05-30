import {useRecoverTimer} from './useRecoverTimer.ts'
import {useSlideUp} from './useSlideUp.ts'
import * as React from "react";

const DURATION = 5

interface RecoverItemProps {
  recoverKey: string
  onRecover: () => void
  onExpire: () => void
}

export function RecoverItem({onRecover, onExpire, recoverKey}: RecoverItemProps) {
  const {ref, hide} = useSlideUp(onExpire)
  const radius = 10
  const circumference = 2 * Math.PI * radius

  const {remaining, offset} = useRecoverTimer(DURATION, hide, circumference, recoverKey)


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
            key={recoverKey}
            className="recover__progress"
            cx="12"
            cy="12"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 12 12)"
            style={
              {
                '--circumference': circumference
              } as React.CSSProperties
            }
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