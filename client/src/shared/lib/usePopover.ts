import {useEffect, useLayoutEffect, useRef, useState} from "react"
import gsap from "gsap"


/**
 * Состояние поповера: открытие/закрытие с анимацией как у DatePicker,
 * закрытие по клику вне контейнера и по Escape.
 */
export function usePopover<C extends HTMLElement = HTMLDivElement, P extends HTMLElement = HTMLDivElement>() {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const containerRef = useRef<C>(null)
  const popoverRef = useRef<P>(null)

  function open() {
    setIsClosing(false)
    setIsOpen(true)
  }

  function close() {
    if (isOpen) setIsClosing(true)
  }

  function toggle() {
    if (isOpen && !isClosing) close()
    else open()
  }

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsClosing(true)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsClosing(true)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  useLayoutEffect(() => {
    if (!isOpen || !popoverRef.current) return

    if (isClosing) {
      gsap.to(popoverRef.current, {
        opacity: 0,
        y: -4,
        scale: 0.98,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: () => {
          setIsOpen(false)
          setIsClosing(false)
        },
      })
      return
    }

    gsap.fromTo(
      popoverRef.current,
      { opacity: 0, y: -4, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.18, ease: 'power2.out' }
    )
  }, [isOpen, isClosing])

  return { isOpen, open, close, toggle, containerRef, popoverRef }
}
