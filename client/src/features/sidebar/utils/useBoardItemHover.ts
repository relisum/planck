import {useEffect, useState} from "react"
import * as React from "react"
import gsap from "gsap"


export function useBoardItemHover(
  tasksCountRef: React.RefObject<HTMLSpanElement | null>,
  taskDeleteRef: React.RefObject<HTMLSpanElement | null>
) {
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (!tasksCountRef.current || !taskDeleteRef.current) return

    gsap.killTweensOf(tasksCountRef.current)
    gsap.killTweensOf(taskDeleteRef.current)

    if (isHovered) {
      gsap.to(tasksCountRef.current, { x: '-50%', opacity: 0, duration: 0.15, ease: 'power2.in' })
      gsap.fromTo(taskDeleteRef.current, { x: '50%', opacity: 0 }, { x: 0, opacity: 1, duration: 0.15, ease: 'power2.out', delay: 0.1 })
    } else {
      gsap.to(taskDeleteRef.current, { x: '50%', opacity: 0, duration: 0.15, ease: 'power2.in' })
      gsap.fromTo(tasksCountRef.current, { x: '-50%', opacity: 0 }, { x: 0, opacity: 1, duration: 0.15, ease: 'power2.out', delay: 0.1 })
    }
  }, [isHovered])

  return { setIsHovered }
}