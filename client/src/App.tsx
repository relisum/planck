import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthPage } from '@/pages/AuthPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PortfolioPage } from '@/pages/PortfolioPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { BusinessCardPage } from '@/pages/BusinessCardPage'
import type { ReactNode } from 'react'
import { userApi } from '@/entities/user'

// Старые ссылки вида /board/:id (до переезда трекера на /dashboard)
function LegacyBoardRedirect() {
  const { boardId } = useParams()
  return <Navigate to={`/dashboard/board/${boardId}`} replace />
}

export function App() {
  const { data: user, isLoading } = userApi.useMe()

  const isAuthed = user !== null && user !== undefined

  // Портфолио публичное и не ждёт /auth/me, трекер и вход — ждут
  const guard = (element: ReactNode) => (isLoading ? null : element)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortfolioPage />} />
        <Route path="/hire" element={<BusinessCardPage />} />
        <Route path="/cv" element={<Navigate to="/hire" replace />} />
        <Route path="/login" element={guard(isAuthed ? <Navigate to="/dashboard" replace /> : <AuthPage />)} />
        <Route path="/dashboard/*" element={guard(isAuthed ? <DashboardPage /> : <Navigate to="/login" replace />)} />
        <Route path="/board/:boardId" element={<LegacyBoardRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
