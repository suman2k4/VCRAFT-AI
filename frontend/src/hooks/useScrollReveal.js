import { useEffect, useRef } from 'react'

/**
 * Scroll-reveal hook — adds the `.visible` class when
 * the element scrolls into view (uses IntersectionObserver).
 *
 * Usage:
 *   const ref = useScrollReveal()
 *   <div ref={ref} className="reveal">…</div>
 */
export default function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          observer.unobserve(el) // animate once
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return ref
}
