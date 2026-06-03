import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthPage } from '@/pages/AuthPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { userApi } from '@/entities/user'

export function App() {
  const { data: user, isLoading } = userApi.useMe()

  if (isLoading) return null

  const isAuthed = user !== null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthed ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route path="/*" element={isAuthed ? <DashboardPage /> : <Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>

  )
}