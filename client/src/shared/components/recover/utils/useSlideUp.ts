import {useEffect, useRef} from "react"
import gsap from "gsap"


export function useSlideUp(onHidden: () => void) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.fromTo(ref.current,
      { y: 100 },
      { y: 0, duration: 0.25, ease: 'back.out(1)' }
    )
  }, [])

  function hide(onComplete?: () => void) {
    gsap.to(ref.current, {
      y: 100,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        onHidden()
        onComplete?.()
      }
    })
  }

  return { ref, hide }
}