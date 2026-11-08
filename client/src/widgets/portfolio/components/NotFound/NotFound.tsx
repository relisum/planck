import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BackLink } from '../BackLink/BackLink'
import notFoundStyles from './notFound.module.sass'


// 404 в виде ответа git на несуществующий путь
export function NotFound() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <div className={notFoundStyles.page}>
      <title>404 | relisum</title>
      <BackLink />
      <div className={notFoundStyles.terminal}>
        <div className={notFoundStyles.bar}><i /><i /><i /></div>
        <pre className={notFoundStyles.body}>
          <span className={notFoundStyles.prompt}>$</span> git checkout {pathname}{'\n'}
          <span className={notFoundStyles.error}>{t('portfolio.not-found.error', { path: pathname })}</span>{'\n'}
          <span className={notFoundStyles.muted}>{t('portfolio.not-found.hint')}</span> <Link to="/">git checkout /</Link>
          <span className={notFoundStyles.cursor} />
        </pre>
      </div>
    </div>
  )
}
