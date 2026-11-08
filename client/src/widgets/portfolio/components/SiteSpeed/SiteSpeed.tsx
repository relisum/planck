import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { lighthouseApi } from '@/entities/lighthouse'
import { formatRelative } from '../../utils/format'
import { useInView } from '../../utils/useInView'
import { Gauge } from '../Gauge/Gauge'
import siteSpeedStyles from './siteSpeed.module.sass'


const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'] as const

// Lighthouse-оценки этого же сайта; замер делает сервер через PageSpeed Insights
export function SiteSpeed() {
  const { t, i18n } = useTranslation()
  const { data } = lighthouseApi.useGetReport()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, 0.5)

  if (!data) return null

  return (
    <div className={siteSpeedStyles.card} ref={ref}>
      <div className={siteSpeedStyles.head}>
        <b>{t('portfolio.site.title')}</b>
        <span>{new URL(data.url).host}</span>
      </div>
      <div className={siteSpeedStyles.body}>
        <div className={siteSpeedStyles.gauges}>
          {CATEGORIES.map(key => (
            <Gauge key={key} value={data.scores[key] ?? 0} label={t(`portfolio.site.${key}`)} filled={inView} />
          ))}
        </div>
        <dl className={siteSpeedStyles.metrics}>
          {data.lcp && <div><dt>{t('portfolio.site.lcp')}</dt><dd>{data.lcp}</dd></div>}
          {data.cls && <div><dt>{t('portfolio.site.cls')}</dt><dd>{data.cls}</dd></div>}
        </dl>
      </div>
      <p className={siteSpeedStyles.note}>{t('portfolio.site.measured', { when: formatRelative(data.fetchedAt, i18n.language) })}</p>
    </div>
  )
}
