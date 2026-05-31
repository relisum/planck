import {useRecoverTimer} from '../utils/useRecoverTimer.ts'
import {useSlideUp} from '../utils/useSlideUp.ts'
import * as React from "react"
import {useTranslation} from "react-i18next"
import recoverStyles from '../recover.module.sass'
import clsx from "clsx"

const DURATION = 5

interface RecoverProps {
  recoverKey: string
  onRecover: () => void
  onExpire: () => void
  position?: 'center' | 'right'
}

export function Recover({onRecover, onExpire, recoverKey, position}: RecoverProps) {
  const { t } = useTranslation()
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
      className={clsx(
        recoverStyles.container,
        position === 'right' ? recoverStyles.right : recoverStyles.center
      )}
    >
      <div className={recoverStyles.timer}>
        <svg width="24" height="24" viewBox="0 0 24 24">
          <circle
            key={recoverKey}
            className={recoverStyles.progress}
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
        <span className={recoverStyles.countdown}>{remaining}</span>
      </div>
      <button className={recoverStyles.btn} onClick={handleRecover}>
        {t('recover')}
      </button>
    </div>
  )
}