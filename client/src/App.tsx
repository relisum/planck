import './style.sass'
import {AuthPage} from "@/pages/AuthPage.tsx";
import {userApi} from "@/entities/user";
import {DashboardPage} from "@/pages/DashboardPage.tsx";


export function App() {
  const { data: user, isLoading } = userApi.useMe()

  if (isLoading) return null
  if (!user) return <AuthPage />

  return <DashboardPage />
}