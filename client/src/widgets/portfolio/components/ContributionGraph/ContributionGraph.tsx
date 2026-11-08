import { useLayoutEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { useTranslation } from 'react-i18next'
import type { ContributionDay } from '@/entities/github'
import { buildEggPattern } from '../../model/egg'
import { EMAIL } from '../../model/resume'
import { formatDate } from '../../utils/format'
import { prefersReducedMotion, useInView } from '../../utils/useInView'
import type { Streaks } from '../../utils/usePortfolio'
import graphStyles from './contributionGraph.module.sass'


interface ContributionGraphProps {
  days: ContributionDay[]
  streaks: Streaks
  isLoading: boolean
  egg: boolean
}

// Пустая сетка-заглушка на время загрузки: 53 недели по 7 дней
const PLACEHOLDER: (ContributionDay | null)[][] = Array.from({ length: 53 }, () => Array(7).fill(null))

function toWeeks(days: ContributionDay[]) {
  const weeks: (ContributionDay | null)[][] = []
  // GitHub начинает календарь с воскресенья, но на всякий случай выравниваем первую неделю
  const offset = days.length ? new Date(days[0].date).getUTCDay() : 0
  const padded = [...Array(offset).fill(null), ...days]
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7))
  return weeks
}

export function ContributionGraph({ days, streaks, isLoading, egg }: ContributionGraphProps) {
  const { t, i18n } = useTranslation()
  const cardRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const inView = useInView(cardRef)
  const weeks = useMemo(() => (days.length ? toWeeks(days) : PLACEHOLDER), [days])
  const eggLevel = useMemo(() => buildEggPattern('HIRE ME', weeks.length), [weeks.length])

  // Подписи месяцев над первой неделей каждого месяца
  const months = useMemo(() => weeks.map((week, i) => {
    const first = week.find(Boolean)
    if (!first) return null
    const prev = weeks[i - 1]?.find(Boolean)
    const month = first.date.slice(0, 7)
    if (prev && prev.date.slice(0, 7) === month) return null
    return formatDate(first.date, i18n.language, { month: 'short' })
  }), [weeks, i18n.language])

  // Свежие недели справа — прокручиваем к ним на узких экранах
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (grid && days.length) grid.scrollLeft = grid.scrollWidth
  }, [days])

  // Клетки «прорастают» волной, когда календарь доскроллили до экрана
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid || !days.length || !inView || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('[data-level]', { scale: 0, duration: 0.4, ease: 'back.out(2)', stagger: { each: 0.0015, from: 'end' } })
    }, grid)
    return () => ctx.revert()
  }, [days, inView])

  // Пасхалка: надпись собирается из клеток от центра
  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card || !egg) return
    card.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-level]', { scale: 0.3 }, { scale: 1, duration: 0.5, ease: 'back.out(2)', stagger: { each: 0.002, from: 'center' } })
    }, gridRef.current!)
    return () => ctx.revert()
  }, [egg])

  const stats = [
    { label: t('portfolio.activity.streak-current'), value: t('portfolio.activity.days', { count: streaks.current }) },
    { label: t('portfolio.activity.streak-longest'), value: t('portfolio.activity.days', { count: streaks.longest }) },
    {
      label: t('portfolio.activity.best-day'),
      value: streaks.best ? `${streaks.best.count} · ${formatDate(streaks.best.date, i18n.language, { day: 'numeric', month: 'short' })}` : '—',
    },
  ]

  return (
    <div className={graphStyles.card} ref={cardRef} data-reveal>
      <div className={graphStyles.head}>
        <b>{isLoading ? '…' : t('portfolio.activity.contributions', { count: streaks.total })}</b>
      </div>

      <div className={graphStyles.scroll} ref={gridRef}>
        <div className={graphStyles.months}>
          {months.map((month, i) => <span key={i}>{month}</span>)}
        </div>
        <div className={graphStyles.grid}>
          {weeks.map((week, w) => (
            <div key={w} className={graphStyles.week}>
              {week.map((day, d) => egg ? (
                <span key={d} className={graphStyles.cell} data-level={eggLevel(w, d)} />
              ) : day ? (
                <span
                  key={day.date}
                  className={graphStyles.cell}
                  data-level={day.level}
                  title={t('portfolio.activity.day', { count: day.count, date: formatDate(day.date, i18n.language) })}
                />
              ) : (
                <span key={d} className={graphStyles.cell} data-empty={!isLoading || undefined} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {egg && (
        <p className={graphStyles.egg}>
          {t('portfolio.activity.egg')}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </p>
      )}

      <div className={graphStyles.foot}>
        <div className={graphStyles.stats}>
          {stats.map(stat => (
            <div key={stat.label}>
              <span>{stat.label}</span>
              <b>{isLoading ? '…' : stat.value}</b>
            </div>
          ))}
        </div>
        <div className={graphStyles.legend}>
          {t('portfolio.activity.less')}
          {[0, 1, 2, 3, 4].map(level => <span key={level} className={graphStyles.cell} data-level={level} />)}
          {t('portfolio.activity.more')}
        </div>
      </div>
    </div>
  )
}
