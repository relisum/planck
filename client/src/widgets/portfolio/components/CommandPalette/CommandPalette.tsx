import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import gsap from 'gsap'
import { useTranslation } from 'react-i18next'
import { type Command, type CommandGroup, useCommands } from '../../utils/useCommands'
import paletteStyles from './commandPalette.module.sass'


const GROUPS: CommandGroup[] = ['navigate', 'actions', 'links']

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  dashboardLink: string
}

export function CommandPalette({ isOpen, onClose, dashboardLink }: CommandPaletteProps) {
  const { t } = useTranslation()
  const commands = useCommands(dashboardLink)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)
  const [isRendered, setIsRendered] = useState(isOpen)
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  if (isOpen && !isRendered) setIsRendered(true)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = q
      ? commands.filter(c => `${c.label} ${c.keywords}`.toLowerCase().includes(q))
      : commands
    // Порядок как в группах, чтобы стрелки шли сверху вниз по экрану
    return GROUPS.flatMap(group => matches.filter(c => c.group === group))
  }, [commands, query])

  // Открытие — проявление с лёгким масштабом, закрытие — обратная анимация, потом размонтирование
  useLayoutEffect(() => {
    if (!isRendered || !overlayRef.current || !panelRef.current) return
    if (isOpen) {
      setQuery('')
      setActive(0)
      setCopied(false)
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.15 })
      gsap.fromTo(panelRef.current, { opacity: 0, scale: 0.97, y: -8 }, { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: 'power2.out' })
      inputRef.current?.focus()
      return
    }
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.12 })
    gsap.to(panelRef.current, { opacity: 0, scale: 0.97, duration: 0.12, onComplete: () => setIsRendered(false) })
  }, [isOpen, isRendered])

  // Активный пункт всегда виден в списке
  useEffect(() => {
    listRef.current?.querySelector('[data-active]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function run(command: Command) {
    const result = command.run()
    if (result === 'copied') {
      setCopied(true)
      setTimeout(onClose, 700)
      return
    }
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(i => (i + 1) % Math.max(filtered.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(i => (i - 1 + filtered.length) % Math.max(filtered.length, 1))
    } else if (e.key === 'Enter' && filtered[active]) {
      e.preventDefault()
      run(filtered[active])
    }
  }

  if (!isRendered) return null

  return createPortal(
    <div
      ref={overlayRef}
      className={paletteStyles.overlay}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div ref={panelRef} className={paletteStyles.panel} role="dialog" aria-modal="true" aria-label={t('portfolio.palette.open')} onKeyDown={handleKeyDown}>
        <div className={paletteStyles.search}>
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
            <path fill="currentColor" d="M10.68 11.74a6 6 0 0 1-7.92-8.98 6 6 0 0 1 8.98 7.92l3.04 3.04a.75.75 0 0 1-1.06 1.06ZM11.5 7a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0Z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActive(0) }}
            placeholder={t('portfolio.palette.placeholder')}
            aria-label={t('portfolio.palette.placeholder')}
          />
          <kbd>Esc</kbd>
        </div>

        <div className={paletteStyles.list} ref={listRef} role="listbox">
          {copied && <p className={paletteStyles.copied}>✓ {t('portfolio.palette.copied')}</p>}
          {!copied && filtered.length === 0 && <p className={paletteStyles.empty}>{t('portfolio.palette.empty')}</p>}
          {!copied && GROUPS.map(group => {
            const items = filtered.filter(c => c.group === group)
            if (!items.length) return null
            return (
              <div key={group} className={paletteStyles.group}>
                <span className={paletteStyles.groupLabel}>{t(`portfolio.palette.groups.${group}`)}</span>
                {items.map(command => {
                  const index = filtered.indexOf(command)
                  return (
                    <button
                      key={command.id}
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      data-active={index === active || undefined}
                      className={clsx(paletteStyles.item, index === active && paletteStyles.active)}
                      onMouseMove={() => setActive(index)}
                      onClick={() => run(command)}
                    >
                      {command.label}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        <div className={paletteStyles.footer}>{t('portfolio.palette.footer')}</div>
      </div>
    </div>,
    document.body
  )
}
