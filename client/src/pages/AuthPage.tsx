import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { AuthTabs, LoginForm, RegisterForm } from '@/features/auth'
import '@/features/auth/styles.sass'
import {ToggleTheme} from "@/shared/components/toggleTheme/ToggleTheme.tsx";

type Tab = 'login' | 'register'

export function AuthPage() {
  const [tab, setTab] = useState<Tab>('login')
  const formRef = useRef<HTMLDivElement>(null)
  const prevHeight = useRef<number>(0)

  function switchTab(newTab: Tab) {
    if (newTab === tab) return
    setTab(newTab)
  }

  useEffect(() => {
    const el = formRef.current
    if (!el) return
    el.style.height = 'auto'
    const targetHeight = el.scrollHeight
    el.style.height = `${prevHeight.current || targetHeight}px`
    gsap.to(el, {
      height: targetHeight,
      duration: 0.25,
      ease: 'power2.out',
      onComplete: () => {
        el.style.height = 'auto'
        prevHeight.current = targetHeight
      }
    })
  }, [tab])

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className={"auth-card__top"}>
          <p className="auth-logo">Planck</p>
          <ToggleTheme />
        </div>
        <AuthTabs active={tab} onChange={switchTab} />
        <div ref={formRef} style={{ overflow: 'hidden' }}>
          {tab === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </div>
  )
}