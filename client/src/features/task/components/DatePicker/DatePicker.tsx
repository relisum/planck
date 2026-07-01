import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { isSameDay } from '@/shared/lib/date.ts';
import styles from './DatePicker.module.sass';
import {useTranslation} from "react-i18next";

const ru = navigator.language.startsWith('ru')

const MONTHS = ru ? ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
  : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ru ? ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
  : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
}

function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(ru ? 'ru-RU' : 'eu-EU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function DatePicker({ value, onChange, minDate, maxDate }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const d = value ? new Date(value) : new Date();
    d.setDate(1);
    return d;
  })

  const { t } = useTranslation();

  const directionRef = useRef<1 | -1>(1);
  const skipGridAnim = useRef(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const today = new Date();
  const days = getMonthGrid(cursor.getFullYear(), cursor.getMonth());

  const isDisabled = (d: Date) =>
    (minDate && d < minDate) || (maxDate && d > maxDate);

  function openPopover() {
    const base = value ? new Date(value) : new Date();
    base.setDate(1);
    skipGridAnim.current = true; // не анимировать сетку при самом открытии
    setCursor(base);
    setIsClosing(false);
    setIsOpen(true);
  }

  function closePopover() {
    setIsClosing(true);
  }

  function handleTriggerClick() {
    if (isOpen) closePopover();
    else openPopover();
  }

  function handleSelect(d: Date) {
    onChange(d);
    closePopover();
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    closePopover();
  }

  const goToMonth = (offset: 1 | -1) => {
    directionRef.current = offset;
    skipGridAnim.current = false;
    setCursor(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + offset);
      return next;
    });
  };

  // закрытие по клику вне поповера
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closePopover();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // анимация появления/скрытия поповера
  useLayoutEffect(() => {
    if (!isOpen || !popoverRef.current) return;

    if (isClosing) {
      gsap.to(popoverRef.current, {
        opacity: 0,
        y: -4,
        scale: 0.98,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: () => {
          setIsOpen(false);
          setIsClosing(false);
        },
      });
      return;
    }

    gsap.fromTo(
      popoverRef.current,
      { opacity: 0, y: -4, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.18, ease: 'power2.out' }
    );
  }, [isOpen, isClosing]);

  // анимация смены месяца
  useLayoutEffect(() => {
    if (skipGridAnim.current) {
      skipGridAnim.current = false;
      return;
    }

    const dir = directionRef.current;

    gsap.fromTo(gridRef.current, { x: dir * 16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.28, ease: 'power2.out' });
    gsap.fromTo(labelRef.current, { y: dir * 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22, ease: 'power2.out' });
  }, [cursor]);

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <button type="button" className={styles.trigger} onClick={handleTriggerClick}>
        <div className={styles.buttonInteract}>
          <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none">
            <path d="M3 9H21M7 3V5M17 3V5M6 13H8M6 17H8M11 13H13M11 17H13M16 13H18M16 17H18M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z" stroke="#91A3BA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span className={value ? styles.triggerValue : styles.triggerPlaceholder}>
            {value ? formatDate(value) : t('board.task.date.add')}
          </span>
        </div>
        {value && (
          <span className={styles.clear} onClick={handleClear} role="button" aria-label={t('board.task.date.clear')}>
            <svg width="8" height="8" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M1 1l12 12M13 1L1 13"></path></svg>
          </span>
        )}
      </button>

      {isOpen && (
        <div ref={popoverRef} className={styles.popover}>
          <div className={styles.header}>
            <button type="button" className={styles.nav} onClick={() => goToMonth(-1)} aria-label="Предыдущий месяц">
              ‹
            </button>
            <div className={styles.monthWrap}>
              <span ref={labelRef} className={styles.month}>
                {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
              </span>
            </div>
            <button type="button" className={styles.nav} onClick={() => goToMonth(1)} aria-label="Следующий месяц">
              ›
            </button>
          </div>

          <div className={styles.weekdays}>
            {WEEKDAYS.map(w => (
              <div key={w} className={styles.weekday}>{w}</div>
            ))}
          </div>

          <div ref={gridRef} className={styles.grid}>
            {days.map(d => {
              const otherMonth = d.getMonth() !== cursor.getMonth();
              const disabled = isDisabled(d);

              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  className={[
                    styles.day,
                    otherMonth && styles.dayOther,
                    isSameDay(d, today) && styles.dayToday,
                    isSameDay(d, value) && styles.daySelected,
                  ].filter(Boolean).join(' ')}
                  disabled={disabled}
                  onClick={() => handleSelect(d)}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {value && (
            <button type="button" className={styles.clearFooter} onClick={handleClear}>
              {t('board.task.date.clear')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}