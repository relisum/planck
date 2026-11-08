import gaugeStyles from './gauge.module.sass'


const RADIUS = 20
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface GaugeProps {
  value: number
  label: string
  // Кольцо заполняется, когда стало true (обычно — блок показался на экране)
  filled: boolean
}

// Кольцо в стиле Lighthouse: 90+ — зелёное, 50–89 — жёлтое, ниже — красное
export function Gauge({ value, label, filled }: GaugeProps) {
  const grade = value >= 90 ? 'good' : value >= 50 ? 'average' : 'poor'

  return (
    <div className={gaugeStyles.gauge}>
      <svg viewBox="0 0 48 48" width="48" height="48">
        <circle cx="24" cy="24" r={RADIUS} className={gaugeStyles.track} />
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          className={gaugeStyles.value}
          data-grade={grade}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={filled ? CIRCUMFERENCE * (1 - value / 100) : CIRCUMFERENCE}
        />
        <text x="24" y="24">{value}</text>
      </svg>
      <span>{label}</span>
    </div>
  )
}
