import { useTranslation } from 'react-i18next'
import { EDUCATION, EXPERIENCE } from '../../model/resume'
import { formatDate } from '../../utils/format'
import experienceStyles from './experience.module.sass'


export function Experience() {
  const { t, i18n } = useTranslation()

  const period = (from: string, to: string | null) => {
    const fmt = (iso: string) => formatDate(`${iso}-01`, i18n.language, { month: 'short', year: 'numeric' })
    return `${fmt(from)} — ${to ? fmt(to) : t('portfolio.experience.present')}`
  }

  return (
    <ol className={experienceStyles.timeline}>
      {EXPERIENCE.map(job => (
        <li key={job.id} className={experienceStyles.item} data-reveal>
          <span className={experienceStyles.dot} />
          <div className={experienceStyles.card}>
            <div className={experienceStyles.head}>
              <div>
                <h3>{t(`portfolio.experience.${job.id}.role`)}</h3>
                <p className={experienceStyles.company}>
                  {job.url
                    ? <a href={job.url} target="_blank" rel="noreferrer">{job.company}</a>
                    : job.company}
                  {' · '}{t(`portfolio.experience.${job.id}.about`)}
                </p>
              </div>
              <span className={experienceStyles.period}>
                {period(job.from, job.to)}
                <br />
                {t(`portfolio.experience.${job.id}.location`)}
              </span>
            </div>
            <ul className={experienceStyles.points}>
              {(t(`portfolio.experience.${job.id}.points`, { returnObjects: true }) as string[]).map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
            <div className={experienceStyles.stack}>
              {job.stack.map(item => <span key={item}>{item}</span>)}
            </div>
          </div>
        </li>
      ))}

      <li className={experienceStyles.item} data-reveal>
        <span className={experienceStyles.dot} data-muted />
        <div className={experienceStyles.card}>
          <div className={experienceStyles.head}>
            <div>
              <h3>{t(`portfolio.experience.${EDUCATION.id}.role`)}</h3>
              <p className={experienceStyles.company}>
                {t(`portfolio.experience.${EDUCATION.id}.company`)} · {t(`portfolio.experience.${EDUCATION.id}.about`)}
              </p>
            </div>
            <span className={experienceStyles.period}>{period(EDUCATION.from, EDUCATION.to)}</span>
          </div>
        </div>
      </li>
    </ol>
  )
}
