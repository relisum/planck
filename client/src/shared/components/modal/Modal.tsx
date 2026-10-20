import {type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState} from "react"
import {createPortal} from "react-dom"
import gsap from "gsap"
import {useTranslation} from "react-i18next"
import modalStyles from './modal.module.sass'


interface ModalProps {
  isOpen: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Модальное окно: поднимается снизу, закрывается по Escape, клику по фону и кнопке.
 * Остаётся в DOM до конца анимации закрытия.
 */
export function Modal({ isOpen, title, onClose, children }: ModalProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const [isRendered, setIsRendered] = useState(isOpen)
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  if (isOpen && !isRendered) setIsRendered(true)

  useLayoutEffect(() => {
    if (!isRendered || !overlayRef.current || !panelRef.current) return

    if (isOpen) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power1.out' })
      gsap.fromTo(
        panelRef.current,
        { y: 24, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.28, ease: 'power3.out' }
      )
      return
    }

    gsap.to(overlayRef.current, { opacity: 0, duration: 0.18, ease: 'power1.in' })
    gsap.to(panelRef.current, {
      y: 16,
      opacity: 0,
      duration: 0.18,
      ease: 'power2.in',
      onComplete: () => setIsRendered(false),
    })
  }, [isOpen, isRendered])

  useEffect(() => {
    if (!isOpen) return

    previousFocus.current = document.activeElement as HTMLElement | null
    const firstField = panelRef.current?.querySelector<HTMLElement>('input, textarea, select')
    ;(firstField ?? panelRef.current)?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus.current?.focus?.()
    }
  }, [isOpen])

  if (!isRendered) return null

  return createPortal(
    <div
      ref={overlayRef}
      className={modalStyles.overlay}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={panelRef}
        className={modalStyles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className={modalStyles.header}>
          <h2 id={titleId} className={modalStyles.title}>{title}</h2>
          <button className={modalStyles.close} onClick={onClose} aria-label={t('modal.close')}>
            <svg width="8" height="8" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>
        <div className={modalStyles.body}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
