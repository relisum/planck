import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { PortfolioPage } from '@/pages/PortfolioPage'
import { userApi } from '@/entities/user'

// Всё, кроме главной, грузится отдельными чанками: посетителю портфолио не нужны dnd-kit и WebAuthn
const AuthPage = lazy(() => import('@/pages/AuthPage').then(m => ({ default: m.AuthPage })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const BusinessCardPage = lazy(() => import('@/pages/BusinessCardPage').then(m => ({ default: m.BusinessCardPage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

// Старые ссылки вида /board/:id (до переезда трекера на /dashboard)
function LegacyBoardRedirect() {
  const { boardId } = useParams()
  return <Navigate to={`/dashboard/board/${boardId}`} replace />
}

/**
 * Проверка сессии (/auth/me) только там, где она нужна: на /login и /dashboard.
 * Публичные страницы её не делают — меньше запросов и нет 401 в консоли
 */
function AuthGate({ authed, guest }: { authed: ReactNode; guest: ReactNode }) {
  const { data: user, isLoading } = userApi.useMe()
  if (isLoading) return null
  return <>{user ? authed : guest}</>
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<PortfolioPage />} />
          <Route path="/hire" element={<BusinessCardPage />} />
          <Route path="/cv" element={<Navigate to="/hire" replace />} />
          <Route path="/login" element={<AuthGate authed={<Navigate to="/dashboard" replace />} guest={<AuthPage />} />} />
          <Route path="/dashboard/*" element={<AuthGate authed={<DashboardPage />} guest={<Navigate to="/login" replace />} />} />
          <Route path="/board/:boardId" element={<LegacyBoardRedirect />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
